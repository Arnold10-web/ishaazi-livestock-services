// models/BasicComponent.js

import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true }, // Comment text
    isOffensive: { type: Boolean, default: false }, // Flag for offensive content (admin use)
    createdAt: { type: Date, default: Date.now } // Timestamp for the comment
  }
);

const basicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Title of the media
    description: { type: String, required: true }, // Description of the video/audio
    fileUrl: { type: String, required: true }, // Path to the uploaded video/audio file
    imageUrl: { type: String, default: null }, // Path to the thumbnail or preview image
    fileType: { type: String, enum: ['video', 'audio'], required: true }, // Media type
    duration: { type: Number, default: null }, // Duration of the media (in seconds)
    downloadCount: { type: Number, default: 0 }, // Tracks downloads
    metadata: { type: Object, default: {} }, // Additional metadata (e.g., file size, format)
    published: { type: Boolean, default: true }, // Publish status
    comments: [commentSchema] // Embedded comments
  },
  { timestamps: true } // Auto-manages createdAt and updatedAt
);

export default mongoose.model('Basic', basicSchema);
