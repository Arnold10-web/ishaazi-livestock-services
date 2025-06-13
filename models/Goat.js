// models/Goat.js
/**
 * Goat Model
 * 
 * This model represents goat farming related content including articles, guides,
 * and resources specific to goat production. It tracks user engagement metrics,
 * supports categorization and tagging, and includes a nested comment system.
 * 
 * The model is part of the specialized livestock content series that includes
 * other models like Beef, Dairy, and Piggery.
 * 
 * @module models/Goat
 */
import mongoose from 'mongoose';

const goatSchema = new mongoose.Schema(
  {
    // Basic content information
    title: { 
      type: String, 
      required: true,
      trim: true
    },
    content: { 
      type: String, 
      required: true 
    },
    imageUrl: { 
      type: String, 
      default: null,
      trim: true
    },
    metadata: { 
      type: Object 
    },
    published: { 
      type: Boolean, 
      default: true 
    },
    
    // Engagement tracking metrics
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
    
    // Article structure and classification
    category: { 
      type: String, 
      default: 'Goat',
      trim: true
    },
    tags: [{ 
      type: String,
      trim: true
    }],
    readTime: { 
      type: Number, 
      default: 5,
      min: 1
    },
    featured: { 
      type: Boolean, 
      default: false 
    },
    
    // Comments system
    comments: [{
      author: { 
        type: String, 
        required: true,
        trim: true
      },
      email: { 
        type: String, 
        required: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      content: { 
        type: String, 
        required: true,
        trim: true
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
  },
  { timestamps: true }
);

// Create indexes for better search performance
goatSchema.index({ title: 'text', content: 'text', tags: 'text' });
goatSchema.index({ category: 1, featured: -1, createdAt: -1 });
goatSchema.index({ published: 1 });

/**
 * Virtual for comment count
 */
goatSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

/**
 * Virtual for approved comments count
 */
goatSchema.virtual('approvedCommentCount').get(function() {
  return this.comments.filter(comment => comment.approved).length;
});

/**
 * Goat model representing goat farming related articles and content
 * Collection name explicitly set to 'goats' for proper plural form
 * @type {mongoose.Model}
 */
export default mongoose.model('Goat', goatSchema, 'goats');