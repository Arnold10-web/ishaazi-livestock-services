// models/Beef.js
/**
 * Beef Model
 * 
 * This model represents beef farming related content including articles, guides,
 * and resources specific to beef cattle production. It tracks user engagement metrics,
 * supports categorization and tagging, and includes a nested comment system.
 * 
 * The model is part of the specialized livestock content series that includes
 * other models like Dairy, Goat, and Piggery.
 * 
 * @module models/Beef
 */
import mongoose from 'mongoose';

const BeefSchema = new mongoose.Schema({
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
    default: 'Beef',
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
  collection: 'beefs'
});

// Create indexes for better search performance
BeefSchema.index({ title: 'text', content: 'text', tags: 'text' });
BeefSchema.index({ category: 1, featured: -1, createdAt: -1 });
BeefSchema.index({ published: 1 });

/**
 * Virtual for comment count
 */
BeefSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

/**
 * Virtual for approved comments count
 */
BeefSchema.virtual('approvedCommentCount').get(function() {
  return this.comments ? this.comments.filter(comment => comment.approved).length : 0;
});

/**
 * Beef model representing beef cattle farming related articles and content
 * Collection name explicitly set to 'beefs' for proper plural form
 * @type {mongoose.Model}
 */
export default mongoose.model('Beef', BeefSchema, 'beefs');