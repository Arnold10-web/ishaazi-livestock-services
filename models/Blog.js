// models/Blog.js
import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: null },
    metadata: { type: Object },
    published: { type: Boolean, default: true }
    
  },
  { timestamps: true }
);

export default mongoose.model('Blog', blogSchema);