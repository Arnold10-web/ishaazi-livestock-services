// models/News.js
import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['agriculture', 'livestock', 'technology', 'market', 'general'],
      default: 'general'
    },
    tags: [{ type: String }],
    imageUrl: { type: String, default: null },
    metadata: { type: Object },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    notificationSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Set publishedAt when published is set to true and send notifications
newsSchema.pre('save', async function(next) {
  try {
    // Set publishedAt when published for the first time
    if (this.published && !this.publishedAt) {
      this.publishedAt = new Date();
    }

    // Check if this is a new publication
    if (this.published && !this.notificationSent && this.isModified('published')) {
      this.notificationSent = true;
      
      // Import notification service dynamically
      const { sendContentNotification } = await import('../services/notificationService.js');
      
      // Determine target subscription types based on news category
      let targetTypes = ['all', 'newsletters'];
      const categoryMap = {
        'livestock': ['livestock-updates'],
        'agriculture': ['farming-tips'],
        'technology': ['farming-tips'],
        'market': ['newsletters']
      };
      targetTypes = [...targetTypes, ...(categoryMap[this.category] || [])];
      
      // Create description from content
      const description = this.content
        .replace(/<[^>]*>/g, '') // Strip HTML
        .substring(0, 200) + '...';
      
      // Send notification asynchronously
      process.nextTick(async () => {
        try {
          await sendContentNotification(
            'news',
            this._id,
            this.title,
            description,
            [...new Set(targetTypes)]
          );
        } catch (error) {
          console.error('Failed to send news notification:', error);
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in news pre-save middleware:', error);
    next();
  }
});

export default mongoose.model('News', newsSchema);