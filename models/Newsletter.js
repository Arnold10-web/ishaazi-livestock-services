/**
 * Newsletter Model
 * 
 * This model represents email newsletters that can be created, scheduled, and sent to subscribers.
 * It stores the newsletter content, targeting information, sending status, and engagement metrics.
 * The model supports different subscription types and tracks metrics like open and click rates.
 * 
 * @module models/Newsletter
 */
import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  // Newsletter content
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  body: { 
    type: String, 
    required: true 
  },
  subject: { 
    type: String, 
    required: true,
    trim: true 
  },
  
  // Newsletter targeting
  targetSubscriptionTypes: [{ 
    type: String, 
    enum: ['all', 'newsletters', 'events', 'auctions', 'farming-tips', 'livestock-updates'],
    required: true
  }],
  
  // Delivery status and metrics
  sentAt: { 
    type: Date, 
    default: null 
  },
  sentTo: { 
    type: Number, 
    default: 0,
    min: 0
  },
  openCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  clickCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  // Newsletter status
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'scheduled'], 
    default: 'draft' 
  },
  
  // Author reference
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
newsletterSchema.index({ status: 1, sentAt: 1 });
newsletterSchema.index({ createdAt: -1 }); // For sorting by creation date

/**
 * Virtual for calculating open rate
 */
newsletterSchema.virtual('openRate').get(function() {
  return this.sentTo > 0 ? (this.openCount / this.sentTo * 100).toFixed(2) : 0;
});

/**
 * Virtual for calculating click rate
 */
newsletterSchema.virtual('clickRate').get(function() {
  return this.openCount > 0 ? (this.clickCount / this.openCount * 100).toFixed(2) : 0;
});

/**
 * Newsletter model representing email newsletters for subscribers
 * @type {mongoose.Model}
 */
export default mongoose.model('Newsletter', newsletterSchema);
