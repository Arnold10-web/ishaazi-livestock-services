const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String }, // Path to the uploaded image
  metadata: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    keywords: { type: [String], default: [] }, // SEO keywords
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('News', newsSchema);
