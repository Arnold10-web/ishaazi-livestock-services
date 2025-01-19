const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  sentAt: { type: Date, default: null },
});

module.exports = mongoose.model('Newsletter', newsletterSchema);