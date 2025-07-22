// models/Farm.js
/**
 * Farm Model
 * 
 * This model represents farm listings that can be bought, sold, or viewed in the platform.
 * It stores information about farms including their physical attributes, pricing,
 * description, images, and engagement metrics. The model supports various farm types
 * and includes tracking for user engagement and listing status.
 * 
 * @module models/Farm
 */
import mongoose from 'mongoose';

const farmSchema = new mongoose.Schema({
  // Basic farm information
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  location: { 
    type: String, 
    required: true,
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  description: { 
    type: String,
    trim: true 
  },
  image: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fs.files',
    default: null
  },
  
  // Farm physical details
  size: { 
    type: String,
    trim: true
  }, // e.g., "150 acres"
  
  farmType: { 
    type: String,
    trim: true
  }, // e.g., "Dairy", "Livestock", "Mixed"
  
  facilities: [{ 
    type: String,
    trim: true 
  }], // e.g., ["Barn", "Milking Parlor"]
  
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
  inquiries: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  // Listing status
  status: { 
    type: String, 
    enum: ['Available', 'Under Offer', 'Sold'], 
    default: 'Available' 
  },
  featured: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Create index for search and sorting
farmSchema.index({ name: 'text', location: 'text', description: 'text' });
farmSchema.index({ status: 1, featured: -1, price: 1 });

/**
 * Farm model representing farm properties that can be listed and viewed
 * @type {mongoose.Model}
 */
export default mongoose.model('Farm', farmSchema);