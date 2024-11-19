// models/Farm.js
const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
    title: String,
    content: String,
    date: { type: Date, default: Date.now },
    author: String,
    image: String, // URL to image, if applicable
});

module.exports = mongoose.model('Farm', farmSchema);
