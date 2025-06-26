/**
 * @file Subscriber Model
 * @description Schema definition for email subscribers, including:
 *  - Subscriber contact information
 *  - Subscription preferences
 *  - Engagement tracking metrics
 *  - Activity timestamps
 * @module models/Subscriber
 */

import mongoose from 'mongoose';

/**
 * @constant {mongoose.Schema} subscriberSchema
 * @description Schema definition for subscriber documents
 */
const subscriberSchema = new mongoose.Schema({
  /**
   * @property {String} email - Primary identifier and contact address
   */
  email: { type: String, required: true, unique: true },
  
  /**
   * @property {String} subscriptionType - Content category preferences
   * @enum ['all', 'newsletters', 'events', 'auctions', 'farming-tips', 'livestock-updates']
   */
  subscriptionType: { 
    type: String, 
    enum: ['all', 'newsletters', 'events', 'auctions', 'farming-tips', 'livestock-updates'], 
    default: 'all' 
  },
  
  /**
   * @property {Boolean} isActive - Whether the subscription is currently active
   */
  isActive: { type: Boolean, default: true },
  
  /**
   * @property {Date} subscribedAt - Timestamp when user first subscribed
   */
  subscribedAt: { type: Date, default: Date.now },
  
  /**
   * @property {Date} lastEmailSent - Timestamp of most recent email sent
   */
  lastEmailSent: { type: Date, default: null },
  
  /**
   * @property {Date} lastOpened - Timestamp of most recent email open
   */
  lastOpened: { type: Date, default: null },
  
  /**
   * @property {Date} lastClicked - Timestamp of most recent link click
   */
  lastClicked: { type: Date, default: null },
  
  /**
   * @property {Number} emailsSent - Total count of emails sent to subscriber
   */
  emailsSent: { type: Number, default: 0 },
  
  /**
   * @property {Number} clickCount - Total count of link clicks
   */
  clickCount: { type: Number, default: 0 },
  
  /**
   * @property {Number} openCount - Total count of email opens
   */
  openCount: { type: Number, default: 0 },
  
  /**
   * @property {String} confirmationToken - Token for email confirmation (double opt-in)
   */
  confirmationToken: { type: String, default: null },
  
  /**
   * @property {Boolean} isConfirmed - Whether email has been confirmed
   */
  isConfirmed: { type: Boolean, default: false },
  
  /**
   * @property {Date} confirmedAt - Timestamp when email was confirmed
   */
  confirmedAt: { type: Date, default: null },

  /**
   * @property {String} unsubscribeToken - Unique token for unsubscribe links
   */
  unsubscribeToken: { type: String, default: () => require('crypto').randomBytes(32).toString('hex') },

  /**
   * @property {Date} unsubscribedAt - Timestamp when user unsubscribed
   */
  unsubscribedAt: { type: Date, default: null },

  // Email delivery failure tracking
  /**
   * @property {Number} failureCount - Count of consecutive email delivery failures
   */
  failureCount: { type: Number, default: 0 },

  /**
   * @property {Date} lastFailureAt - Timestamp of most recent delivery failure
   */
  lastFailureAt: { type: Date, default: null },

  /**
   * @property {String} lastFailureType - Type of most recent delivery failure
   */
  lastFailureType: { type: String, default: null },

  /**
   * @property {String} failureReason - Human-readable reason for permanent failure
   */
  failureReason: { type: String, default: null },

  /**
   * @property {Boolean} permanentFailure - Whether this email has permanent delivery issues
   */
  permanentFailure: { type: Boolean, default: false },
}, {
  timestamps: true
});

/**
 * Indexes for optimizing common query patterns
 */
// Index for finding active subscribers and email lookups
subscriberSchema.index({ email: 1, isActive: 1 });

// Index for filtering subscribers by subscription type
subscriberSchema.index({ subscriptionType: 1 });

/**
 * @constant {mongoose.Model} Subscriber
 * @description Mongoose model for email subscribers
 */
export default mongoose.model('Subscriber', subscriberSchema);
