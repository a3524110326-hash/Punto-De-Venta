require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Product = require('./models/Product');
const Sale = require('./models/Sale');

// Mapeo directo de la URI usada en index.js
const MONGO_URI = "mongodb://uttreyes_db_user:5R9iY48aOLxBF38T@ac-kqfvmz8-shard-00-00.tmy7men.mongodb.net:27017,ac-kqfvmz8-shard-00-01.tmy7men.mongodb.net:27017,ac-kqfvmz8-shard-00-02.tmy7men.mongodb.net:27017/puntovent_db?ssl=true&replicaSet=atlas-z3jt19-shard-0&authSource=admin";

const TOTAL_SALES = 10000;
const BATCH_SIZE = 2000; // Inserción en bloques de 2,000 para optimizar velocidad

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI, { family: 4 });
    console.log('🔥 Conectado a MongoDB Atlas para simulación...');

    // Limpiar colecciones previas si existen
    await Product.deleteMany({});
    await Sale.deleteMany({});
    console.log('🧹 Base de datos limpiada exitosamente.');

    // 1. Generar 100 Productos con datos polimórficos
    console.log('📦 Generando catálogo de productos...');
    const categories = ['Electrónica', 'Ropa', 'Abarrotes', 'Ferretería', 'Hogar'];
    const products = [];

    for (let i = 1; i <= 100; i++) {
      const category = faker.helpers.arrayElement(categories);
      let attributes = {};

      if (category === 'Ropa') {
        attributes = { color: faker.color.human(), size: faker.helpers.arrayElement(['CH', 'M', 'G', 'XG']) };
      } else if (category === 'Electrónica') {
        attributes = { warranty_months: faker.number.int({ min: 6, max: 36 }), voltage: '110V' };
      } else if (category === 'Ferretería') {
        attributes = { weight_kg: faker.number.float({ min: 0.1, max: 15, fractionDigits: 2 }) };
      }

      products.push({
        sku: `SKU-${1000 + i}`,
        name: faker.commerce.productName(),
        category: category,
        base_price: parseFloat(faker.commerce.price({ min: 20, max: 1500, dec: 2 })),
        stock: faker.number.int({ min: 10, max: 500 }),
        status: 'active',
        attributes: attributes
      });
    }

    const insertedProducts = await Product.insertMany(products);
    console.log(`✅ ${insertedProducts.length} productos creados.`);

    // 2. Generar 10,000 ventas en bloques
    console.log(`⚡ Insertando ${TOTAL_SALES} ventas en lotes de ${BATCH_SIZE}...`);
    const paymentMethods = ['cash', 'credit_card', 'debit_card', 'transfer'];
    let salesBatch = [];
    let insertedCount = 0;

    for (let i = 1; i <= TOTAL_SALES; i++) {
      const numItems = faker.number.int({ min: 1, max: 5 });
      const saleItems = [];
      let subtotalAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const prod = faker.helpers.arrayElement(insertedProducts);
        const qty = faker.number.int({ min: 1, max: 4 });
        const itemSubtotal = prod.base_price * qty;

        subtotalAmount += itemSubtotal;
        saleItems.push({
          product_id: prod._id,
          name: prod.name,
          quantity: qty,
          unit_price: prod.base_price,
          subtotal: parseFloat(itemSubtotal.toFixed(2))
        });
      }

      const taxAmount = parseFloat((subtotalAmount * 0.16).toFixed(2));
      const totalAmount = parseFloat((subtotalAmount + taxAmount).toFixed(2));

      salesBatch.push({
        receipt_folio: `TKT-${String(i).padStart(6, '0')}`,
        cashier_id: `cashier_0${faker.number.int({ min: 1, max: 4 })}`,
        items: saleItems,
        subtotal_amount: parseFloat(subtotalAmount.toFixed(2)),
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_method: faker.helpers.arrayElement(paymentMethods),
        createdAt: faker.date.between({ from: '2026-01-01', to: '2026-11-09' })
      });

      if (salesBatch.length === BATCH_SIZE || i === TOTAL_SALES) {
        await Sale.insertMany(salesBatch);
        insertedCount += salesBatch.length;
        console.log(`  -> Progresión: ${insertedCount}/${TOTAL_SALES} ventas insertadas.`);
        salesBatch = [];
      }
    }

    console.log('🎉 ¡Carga masiva completada exitosamente en MongoDB Atlas!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error al ejecutar seeder:', error);
    process.exit(1);
  }
};

seedDatabase();