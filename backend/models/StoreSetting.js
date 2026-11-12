const mongoose = require('mongoose');

const storeSettingSchema = new mongoose.Schema({
  store_name: { type: String, required: true, default: 'Mi Tienda ' },
  currency: { type: String, default: 'MXN' },
  tax_rate: { type: Number, default: 0.16 },
  dynamic_attributes: [
    {
      key: { type: String, required: true },
      label: { type: String, required: true },
      type: { type: String, enum: ['string', 'number', 'boolean'], default: 'string' }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('StoreSetting', storeSettingSchema);