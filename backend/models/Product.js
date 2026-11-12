const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  base_price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  // Tipo 'Mixed' permite guardar un objeto JSON libre (nuestro esquema polimórfico)
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);