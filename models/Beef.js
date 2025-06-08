// models/Beef.js
import mongoose from 'mongoose';

const beefSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: null },
    metadata: { type: Object },
    published: { type: Boolean, default: true },
    // Engagement tracking
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    // Article structure
    category: { type: String, default: 'Beef' },
    tags: [{ type: String }],
    readTime: { type: Number, default: 5 },
    featured: { type: Boolean, default: false },
    // Comments system
    comments: [{
      author: { type: String, required: true },
      email: { type: String, required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      approved: { type: Boolean, default: false }
    }]
  },
  { timestamps: true }
);

export default mongoose.model('Beef', beefSchema, 'beefs');