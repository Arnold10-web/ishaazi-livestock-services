// models/Farm.js
import mongoose from 'mongoose';

const farmSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  imageUrl: { type: String, required: true },
  // Farm details
  size: { type: String }, // e.g., "150 acres"
  farmType: { type: String }, // e.g., "Dairy", "Livestock", "Mixed"
  facilities: [{ type: String }], // e.g., ["Barn", "Milking Parlor"]
  // Engagement tracking
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  // Status
  status: { type: String, enum: ['Available', 'Under Offer', 'Sold'], default: 'Available' },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Farm', farmSchema);