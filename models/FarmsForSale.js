// models/FarmsForSale.js
const mongoose = require('mongoose');

const farmsForSaleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  imageUrl: { type: String, required: true }, // Image of the farm
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FarmsForSale', farmsForSaleSchema);