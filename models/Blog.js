/**
 * Blog Model
 * 
 * Represents blog articles in the farming magazine. Includes content management,
 * metadata, engagement tracking, and a comment system.
 * 
 * @module models/Blog
 */
import mongoose from 'mongoose';

/**
 * Blog Schema Definition
 * 
 * @typedef {Object} BlogSchema
 * @property {string} title - Blog post title
 * @property {string} content - Blog post content, typically HTML from rich text editor
 * @property {string} [imageUrl] - URL to the featured image
 * @property {Object} [metadata] - Additional metadata like author, keywords, SEO content
 * @property {boolean} [published=true] - Whether the blog is publicly visible
 * @property {Date} [publishedAt] - Date when blog was first published
 * @property {boolean} [notificationSent=false] - Whether notification was sent for this blog
 * @property {number} [views=0] - Number of views/reads
 * @property {number} [likes=0] - Number of likes/upvotes
 * @property {number} [shares=0] - Number of times shared
 * @property {string} [category=General] - Blog category
 * @property {string[]} [tags] - Array of tags
 * @property {number} [readTime=5] - Estimated reading time in minutes
 * @property {boolean} [featured=false] - Whether this is a featured blog post
 * @property {Array} [comments] - Array of user comments
 */
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

/**
 * Middleware to set publishedAt timestamp and trigger notifications
 * Runs before saving a blog document
 * 
 * @function pre-save
 * @async
 * @param {Function} next - Mongoose middleware next function
 */
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