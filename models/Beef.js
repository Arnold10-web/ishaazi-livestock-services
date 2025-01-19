const mongoose = require('mongoose');

const beefSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: null },
    metadata: { type: Object },
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Beef', beefSchema);
