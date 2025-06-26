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

const dairySchema = new mongoose.Schema(
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
      default: 'Dairy',
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
    }
  },
  { timestamps: true }
);

// Create indexes for better search performance
dairySchema.index({ title: 'text', content: 'text', tags: 'text' });
dairySchema.index({ category: 1, featured: -1, createdAt: -1 });
dairySchema.index({ published: 1 });

/**
 * Virtual for comment count
 */
dairySchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

/**
 * Virtual for approved comments count
 */
dairySchema.virtual('approvedCommentCount').get(function() {
  return this.comments.filter(comment => comment.approved).length;
});

/**
 * Dairy model representing dairy farming related articles and content
 * Collection name explicitly set to 'dairies' for proper plural form
 * @type {mongoose.Model}
 */
export default mongoose.model('Dairy', dairySchema, 'dairies');