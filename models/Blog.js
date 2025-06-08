// models/Blog.js
import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: null },
    metadata: { type: Object },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date },
    notificationSent: { type: Boolean, default: false },
    // Engagement tracking
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    // Article structure
    category: { type: String, default: 'General' },
    tags: [{ type: String }],
    readTime: { type: Number, default: 5 }, // estimated minutes
    featured: { type: Boolean, default: false },
    // Comments system
    comments: [{
      author: { type: String, required: true },
      email: { type: String, required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      approved: { type: Boolean, default: false }
    }]
  },
  { timestamps: true }
);

// Middleware to set publishedAt and trigger notifications
blogSchema.pre('save', async function(next) {
  try {
    // Set publishedAt when blog is published for the first time
    if (this.published && !this.publishedAt) {
      this.publishedAt = new Date();
    }

    // Check if this is a new publication (published changed to true and notification not sent)
    if (this.published && !this.notificationSent && this.isModified('published')) {
      // Mark that we'll send notification to avoid duplicate sends
      this.notificationSent = true;
      
      // Import notification service dynamically to avoid circular imports
      const { sendContentNotification } = await import('../services/notificationService.js');
      
      // Determine target subscription types based on blog category
      let targetTypes = ['all', 'farming-tips'];
      if (this.category) {
        const categoryMap = {
          'Livestock': ['livestock-updates'],
          'Agriculture': ['farming-tips'],
          'Technology': ['farming-tips'],
          'News': ['newsletters']
        };
        targetTypes = [...targetTypes, ...(categoryMap[this.category] || [])];
      }
      
      // Create description from content
      const description = this.content
        .replace(/<[^>]*>/g, '') // Strip HTML
        .substring(0, 200) + '...';
      
      // Send notification asynchronously (don't block saving)
      process.nextTick(async () => {
        try {
          await sendContentNotification(
            'blog',
            this._id,
            this.title,
            description,
            [...new Set(targetTypes)] // Remove duplicates
          );
        } catch (error) {
          console.error('Failed to send blog notification:', error);
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in blog pre-save middleware:', error);
    next(); // Don't block saving if notification fails
  }
});

export default mongoose.model('Blog', blogSchema);