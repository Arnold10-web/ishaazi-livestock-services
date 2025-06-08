import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  subject: { type: String, required: true },
  targetSubscriptionTypes: [{ 
    type: String, 
    enum: ['all', 'newsletters', 'events', 'auctions', 'farming-tips', 'livestock-updates'] 
  }],
  sentAt: { type: Date, default: null },
  sentTo: { type: Number, default: 0 },
  openCount: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'scheduled'], 
    default: 'draft' 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, {
  timestamps: true
});

// Index for better query performance
newsletterSchema.index({ status: 1, sentAt: 1 });

export default mongoose.model('Newsletter', newsletterSchema);
