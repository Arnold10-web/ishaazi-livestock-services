/**
 * @file Notification Model
 * @description Schema definition for the notification system, tracking:
 *  - Notification metadata (type, content references, title, description)
 *  - Notification targeting (subscription types)
 *  - Delivery metrics (sentTo, openCount, clickCount)
 *  - Status tracking and error handling
 * @module models/Notification
 */

import mongoose from 'mongoose';

/**
 * @constant {mongoose.Schema} notificationSchema
 * @description Schema definition for notification documents
 */
const notificationSchema = new mongoose.Schema({
  /**
   * @property {String} type - The trigger type for the notification
   * @enum ['content_published', 'event_created', 'newsletter_sent']
   */
  type: { 
    type: String, 
    enum: ['content_published', 'event_created', 'newsletter_sent'], 
    required: true 
  },
  
  /**
   * @property {String} contentType - The type of content related to this notification
   * @enum ['blog', 'news', 'event', 'magazine', 'newsletter']
   */
  contentType: { 
    type: String, 
    enum: ['blog', 'news', 'event', 'magazine', 'newsletter'], 
    required: true 
  },
  
  /**
   * @property {mongoose.Schema.Types.ObjectId} contentId - Reference to the content object
   */
  contentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  
  /**
   * @property {String} title - User-friendly notification title
   */
  title: { type: String, required: true },
  
  /**
   * @property {String} description - Detailed notification message
   */
  description: { type: String, required: true },
  
  /**
   * @property {Array<String>} targetSubscriptionTypes - Types of subscriptions to target
   * @enum ['all', 'newsletters', 'events', 'auctions', 'farming-tips', 'livestock-updates']
   */
  targetSubscriptionTypes: [{ 
    type: String, 
    enum: ['all', 'newsletters', 'events', 'auctions', 'farming-tips', 'livestock-updates'] 
  }],
  
  /**
   * @property {Number} sentTo - Count of recipients notification was sent to
   */
  sentTo: { type: Number, default: 0 },
  
  /**
   * @property {Number} openCount - Count of times notification was opened
   */
  openCount: { type: Number, default: 0 },
  
  /**
   * @property {Number} clickCount - Count of times notification links were clicked
   */
  clickCount: { type: Number, default: 0 },
  
  /**
   * @property {String} status - Current status of the notification
   * @enum ['pending', 'sent', 'failed']
   */
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'failed'], 
    default: 'pending' 
  },
  
  /**
   * @property {Date} sentAt - Timestamp when notification was sent
   */
  sentAt: { type: Date, default: null },
  
  /**
   * @property {String} errorMessage - Error details if notification failed
   */
  errorMessage: { type: String, default: null }
}, {
  timestamps: true
});

/**
 * Indexes for optimizing common query patterns
 */
// Index for filtering by status and sorting by sent date
notificationSchema.index({ status: 1, sentAt: 1 });

// Index for looking up notifications related to specific content
notificationSchema.index({ contentType: 1, contentId: 1 });

/**
 * @constant {mongoose.Model} Notification
 * @description Mongoose model for notifications
 */
export default mongoose.model('Notification', notificationSchema);
