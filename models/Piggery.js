// models/Piggery.js
/**
 * Piggery Model
 * 
 * This model represents pig farming related content including articles, guides,
 * and resources specific to swine production. It tracks user engagement metrics,
 * supports categorization and tagging, and includes a nested comment system.
 * 
 * The model is part of the specialized livestock content series that includes
 * other models like Beef, Dairy, and Goat.
 * 
 * @module models/Piggery
 */
import mongoose from 'mongoose';

const PiggerySchema = new mongoose.Schema({
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
    default: 'Piggery',
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
  collection: 'piggeries'
});

// Create indexes for better search performance
PiggerySchema.index({ title: 'text', content: 'text', tags: 'text' });
PiggerySchema.index({ category: 1, featured: -1, createdAt: -1 });
PiggerySchema.index({ published: 1 });

/**
 * Virtual for comment count
 */
PiggerySchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

/**
 * Virtual for approved comments count
 */
PiggerySchema.virtual('approvedCommentCount').get(function() {
  return this.comments ? this.comments.filter(comment => comment.approved).length : 0;
});

/**
 * Piggery model representing pig farming related articles and content
 * Collection name explicitly set to 'piggeries' for proper plural form
 * @type {mongoose.Model}
 */
export default mongoose.model('Piggery', PiggerySchema, 'piggeries');