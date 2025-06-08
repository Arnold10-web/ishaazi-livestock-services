import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscriptionType: { 
    type: String, 
    enum: ['all', 'newsletters', 'events', 'auctions', 'farming-tips', 'livestock-updates'], 
    default: 'all' 
  },
  isActive: { type: Boolean, default: true },
  subscribedAt: { type: Date, default: Date.now },
  lastEmailSent: { type: Date, default: null },
  lastOpened: { type: Date, default: null },
  lastClicked: { type: Date, default: null },
  emailsSent: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  openCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Index for better query performance
subscriberSchema.index({ email: 1, isActive: 1 });
subscriberSchema.index({ subscriptionType: 1 });

export default mongoose.model('Subscriber', subscriberSchema);
