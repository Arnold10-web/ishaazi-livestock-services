// models/FarmBasics.js

const mongoose = require('mongoose');

const farmBasicsSchema = new mongoose.Schema({
  type: { type: String, enum: ['video', 'audio'], required: true },
  title: { type: String, required: true },
  url: { type: String, required: true }, // Store video/audio URL
  description: { type: String },
  imageUrl: { type: String }, // Thumbnail image for videos/audios
  comments: [{ body: String, createdAt: Date }], // Visitor comments
});
module.exports = mongoose.model('FarmBasics', farmBasicsSchema);