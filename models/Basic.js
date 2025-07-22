// models/Basic.js
/**
 * Basic Media Model
 * 
 * This model represents basic media content (videos and audio files) within the platform.
 * It stores information about media files including title, description, file paths,
 * metadata, and user engagement.
 * 
 * @module models/Basic
 */
import mongoose from 'mongoose';

/**
 * Schema for basic media content (videos/audio)
 * @type {mongoose.Schema}
 */
const basicSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true
    }, // Title of the media
    
    description: { 
      type: String, 
      required: true,
      trim: true 
    }, // Description of the video/audio
    
    mediaFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'fs.files',
      required: true
    }, // GridFS ID of the video/audio file

    thumbnail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'fs.files',
      default: null
    }, // GridFS ID of the thumbnail image
    
    fileUrl: { 
      type: String, 
      required: true,
      trim: true 
    }, // Path to the uploaded video/audio file
    
    imageUrl: { 
      type: String, 
      default: null,
      trim: true 
    }, // Path to the thumbnail or preview image
    
    fileType: { 
      type: String, 
      enum: ['video', 'audio'], 
      required: true 
    }, // Media type
    
    duration: { 
      type: Number, 
      default: null,
      min: 0 
    }, // Duration of the media (in seconds)
    
    downloadCount: { 
      type: Number, 
      default: 0,
      min: 0
    }, // Tracks downloads
    
    metadata: { 
      type: Object, 
      default: {} 
    }, // Additional metadata (e.g., file size, format)
    
    published: { 
      type: Boolean, 
      default: true 
    } // Publish status
  },
  { timestamps: true } // Auto-manages createdAt and updatedAt
);

// Create indexes for better search and filtering
basicSchema.index({ title: 'text', description: 'text' });
basicSchema.index({ fileType: 1, published: 1 });
basicSchema.index({ createdAt: -1 });

/**
 * Virtual for comment count
 */
basicSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

/**
 * Basic model representing media content (video/audio)
 * @type {mongoose.Model}
 */
export default mongoose.model('Basic', basicSchema);
