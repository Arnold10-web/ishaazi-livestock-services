import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    location: { type: String },
    imageUrl: { type: String, default: null },
    metadata: { type: Object },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date },
    notificationSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Middleware to set publishedAt and trigger notifications
eventSchema.pre('save', async function(next) {
  try {
    // Set publishedAt when event is published for the first time
    if (this.published && !this.publishedAt) {
      this.publishedAt = new Date();
    }

    // Check if this is a new publication
    if (this.published && !this.notificationSent && this.isModified('published')) {
      this.notificationSent = true;
      
      // Import notification service dynamically
      const { sendContentNotification } = await import('../services/notificationService.js');
      
      // Events target event subscribers
      const targetTypes = ['all', 'events'];
      
      // Create description with event details
      const eventDate = new Date(this.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
      
      let description = `📅 ${eventDate}`;
      if (this.location) {
        description += ` | 📍 ${this.location}`;
      }
      description += `\n\n${this.description.substring(0, 150)}...`;
      
      // Send notification asynchronously
      process.nextTick(async () => {
        try {
          await sendContentNotification(
            'event',
            this._id,
            this.title,
            description,
            targetTypes
          );
        } catch (error) {
          console.error('Failed to send event notification:', error);
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in event pre-save middleware:', error);
    next();
  }
});

export default mongoose.model('Event', eventSchema);

