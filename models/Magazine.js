// models/Magazine.js
const mongoose = require('mongoose');

const magazineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 }, // Optional field for any discount
  fileUrl: { type: String, required: true }, // URL of the uploaded magazine file
  imageUrl: { type: String }, // Cover image for the magazine
  uploadDate: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
});

module.exports = mongoose.model('Magazine', magazineSchema);