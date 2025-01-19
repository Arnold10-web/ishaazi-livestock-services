// models/Magazine.js
const mongoose = require('mongoose');

const magazineSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Magazine title
    description: { type: String, required: true }, // Magazine description
    issue: { type: String, required: true }, // Magazine issue identifier
    price: { type: Number, default: 0 }, // Price of the magazine
    discount: { type: Number, default: 0 }, // Discount percentage or amount
    imageUrl: { type: String, default: null }, // Path to the uploaded image file
    fileUrl: { type: String, required: true }, // Path to the uploaded PDF file
    metadata: { type: Object, default: {} }, // Additional JSON metadata
    published: { type: Boolean, default: true } // Publish status
  },
  { timestamps: true } // Auto-manages createdAt and updatedAt fields
);

module.exports = mongoose.model('Magazine', magazineSchema);