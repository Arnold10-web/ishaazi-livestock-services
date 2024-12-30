// models/Farm.js
import mongoose from 'mongoose';

const farmSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  imageUrl: { type: String, required: true }, // Image of the farm
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Farm', farmSchema);