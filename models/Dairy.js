// models/Dairy.js
/**
 * Dairy Model
 * 
 * This model represents dairy farming related content including articles, guides,
 * and resources specific to dairy production. It tracks user engagement metrics,
 * supports categorization and tagging, and includes a nested comment system.
 * 
 * The model is part of the specialized livestock content series that includes
 * other models like Beef, Goat, and Piggery.
 * 
 * @module models/Dairy
 */
import mongoose from 'mongoose';

const DairySchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  author: { 
    type: String, 
    default: '',
    trim: true 
  },
  category: { 
    type: String, 
    default: 'Dairy',
    trim: true 
  },
  tags: [{ 
    type: String,
    trim: true 
  }],
  image: { 
    type: mongoose.Schema.Types.ObjectId, // GridFS file ID
    default: null 
  },
  imageUrl: { 
    type: String, 
    default: null // Legacy field for backward compatibility
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  published: { 
    type: Boolean, 
    default: false 
  },
  featured: { 
    type: Boolean, 
    default: false 
  },
  views: { 
    type: Number, 
    default: 0,
    min: 0
  },
  likes: { 
    type: Number, 
    default: 0,
    min: 0
  },
  shares: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  comments: [{
    content: { 
      type: String, 
      required: true 
    },
    author: { 
      type: String, 
      default: 'Anonymous' 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    approved: { 
      type: Boolean, 
      default: false 
    }
  }]
}, {
  timestamps: true,
  collection: 'dairies'
});

// Create indexes for better search performance
DairySchema.index({ title: 'text', content: 'text', tags: 'text' });
DairySchema.index({ category: 1, featured: -1, createdAt: -1 });
DairySchema.index({ published: 1 });

/**
 * Virtual for comment count
 */
DairySchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

/**
 * Virtual for approved comments count
 */
DairySchema.virtual('approvedCommentCount').get(function() {
  return this.comments ? this.comments.filter(comment => comment.approved).length : 0;
});

/**
 * Dairy model representing dairy farming related articles and content
 * Collection name explicitly set to 'dairies' for proper plural form
 * @type {mongoose.Model}
 */
export default mongoose.model('Dairy', DairySchema, 'dairies');