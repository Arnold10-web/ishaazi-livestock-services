/**
 * @file News Model
 * @description Schema definition and middleware for news articles, including:
 *  - Core article properties (title, content, author)
 *  - Categorization and tagging
 *  - Publication workflow and status tracking
 *  - View counting for analytics
 *  - Automated notification handling
 * @module models/News
 */

import mongoose from 'mongoose';

/**
 * @constant {mongoose.Schema} newsSchema
 * @description Schema definition for news article documents
 */
const newsSchema = new mongoose.Schema(
  {
    /**
     * @property {String} title - The headline of the news article
     */
    title: { type: String, required: true },
    
    /**
     * @property {String} content - The main body text of the article (HTML allowed)
     */
    content: { type: String, required: true },
    
    /**
     * @property {String} author - The name of the article's author (optional)
     */
    author: { type: String, required: false },
    
    /**
     * @property {String} category - The primary category of the news article
     * @enum ['Breaking', 'Market', 'Weather', 'Policy', 'General']
     */
    category: { 
      type: String, 
      enum: ['Breaking', 'Market', 'Weather', 'Policy', 'General'],
      default: 'General'
    },
    
    /**
     * @property {Array<String>} tags - Keywords for article searchability and filtering
     */
    tags: [{ type: String }],

    /**
     * @property {mongoose.Types.ObjectId} image - GridFS ID of the article's featured image
     */
    image: { type: mongoose.Schema.Types.ObjectId, ref: 'fs.files', default: null },
    
    /**
     * @property {String} imageUrl - URL to the article's primary image
     */
    imageUrl: { type: String, default: null },
    
    /**
     * @property {Object} metadata - Flexible storage for SEO metadata and additional attributes
     */
    metadata: { type: Object },
    
    /**
     * @property {Boolean} published - Whether the article is publicly visible
     */
    published: { type: Boolean, default: false },
    
    /**
     * @property {Date} publishedAt - Timestamp when the article was first published
     */
    publishedAt: { type: Date },
    
    /**
     * @property {Boolean} notificationSent - Tracks if notifications were sent for this article
     */
    notificationSent: { type: Boolean, default: false },
    
    /**
     * @property {Boolean} isBreaking - Indicates high-priority breaking news
     */
    isBreaking: { type: Boolean, default: false },
    
    /**
     * @property {Boolean} featured - Indicates if this is featured news
     */
    featured: { type: Boolean, default: false },
    
    /**
     * @property {Number} views - Count of article views for analytics
     */
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

/**
 * Middleware: Pre-save hook for news articles
 * 
 * @description Handles two key operations:
 *  1. Sets publishedAt timestamp when an article is first published
 *  2. Sends notifications to subscribers when an article is published
 *    - Dynamically targets subscriber groups based on article category
 *    - Creates a brief description from article content
 */
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

/**
 * @constant {mongoose.Model} News
 * @description Mongoose model for news articles
 */
export default mongoose.model('News', newsSchema);