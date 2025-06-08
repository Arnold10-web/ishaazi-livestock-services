// models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['content_published', 'event_created', 'newsletter_sent'], 
    required: true 
  },
  contentType: { 
    type: String, 
    enum: ['blog', 'news', 'event', 'magazine', 'newsletter'], 
    required: true 
  },
  contentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetSubscriptionTypes: [{ 
    type: String, 
    enum: ['all', 'newsletters', 'events', 'auctions', 'farming-tips', 'livestock-updates'] 
  }],
  sentTo: { type: Number, default: 0 },
  openCount: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'failed'], 
    default: 'pending' 
  },
  sentAt: { type: Date, default: null },
  errorMessage: { type: String, default: null }
}, {
  timestamps: true
});

// Index for better query performance
notificationSchema.index({ status: 1, sentAt: 1 });
notificationSchema.index({ contentType: 1, contentId: 1 });

export default mongoose.model('Notification', notificationSchema);
