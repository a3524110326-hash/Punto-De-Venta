const Sale = require('../models/Sale');
const Product = require('../models/Product');

// Obtener ventas (con paginación para no saturar la memoria)
const getSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const sales = await Sale.find()
      .sort({ createdAt: -1 }) // Las más recientes primero
      .skip(skip)
      .limit(limit);

    const totalSales = await Sale.countDocuments();

    res.status(200).json({
      total: totalSales,
      page,
      totalPages: Math.ceil(totalSales / limit),
      data: sales
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
  }
};

// Crear una nueva venta y descontar stock
const createSale = async (req, res) => {
  try {
    const { receipt_folio, cashier_id, items, subtotal_amount, tax_amount, total_amount, payment_method } = req.body;

    // 1. Guardar el ticket de venta
    const newSale = new Sale({
      receipt_folio,
      cashier_id,
      items,
      subtotal_amount,
      tax_amount,
      total_amount,
      payment_method
    });
    const savedSale = await newSale.save();

    // 2. Descontar el stock de cada producto vendido
    for (let item of items) {
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { stock: -item.quantity } // Resta la cantidad vendida
      });
    }

    res.status(201).json(savedSale);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la venta', error: error.message });
  }
};

module.exports = { getSales, createSale };