const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  subtotal: { type: Number, required: true }
}, { _id: false }); // No necesitamos un ID para cada producto dentro del ticket

const saleSchema = new mongoose.Schema({
  receipt_folio: { type: String, required: true, unique: true },
  cashier_id: { type: String, required: true },
  items: [saleItemSchema],
  subtotal_amount: { type: Number, required: true },
  tax_amount: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  payment_method: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);