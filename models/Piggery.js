// models/Piggery.js
import mongoose from 'mongoose';

const piggerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: null },
    metadata: { type: Object },
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Piggery', piggerySchema);