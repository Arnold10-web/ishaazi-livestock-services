/**
 * @file Magazine Model
 * @description Schema definition for digital magazine publications:
 *  - Core magazine properties (title, description, issue)
 *  - Purchase information (price, discount)
 *  - Digital assets (cover image, PDF document)
 *  - Publication status and tracking
 * @module models/Magazine
 */

import mongoose from 'mongoose';

/**
 * @constant {mongoose.Schema} magazineSchema
 * @description Schema definition for digital magazine documents
 */
const magazineSchema = new mongoose.Schema(
  {
    /**
     * @property {String} title - The title or headline of the magazine issue
     */
    title: { type: String, required: true },
    
    /**
     * @property {String} description - Summary or table of contents for the issue
     */
    description: { type: String, required: true },
    
    /**
     * @property {String} issue - Unique identifier for the issue (e.g., "June 2025")
     */
    issue: { type: String, required: true },
    
    /**
     * @property {Number} price - Purchase price in currency units (default: 0 = free)
     */
    price: { type: Number, default: 0 },
    
    /**
     * @property {Number} discount - Discount percentage or amount for promotional pricing
     */
    discount: { type: Number, default: 0 },
    
    /**
     * @property {String} imageUrl - URL to the magazine cover image
     */
    imageUrl: { type: String, default: null },
    
    /**
     * @property {String} fileUrl - URL to the downloadable magazine PDF
     */
    fileUrl: { type: String, required: true },
    
    /**
     * @property {String} author - Author or editor of the magazine issue
     */
    author: { type: String, default: '' },
    
    /**
     * @property {String} category - Category classification for the magazine
     */
    category: { type: String, default: 'Magazine' },
    
    /**
     * @property {Array<String>} tags - Keywords for magazine searchability and filtering
     */
    tags: [{ type: String }],
    
    /**
     * @property {Boolean} featured - Whether this is a featured magazine issue
     */
    featured: { type: Boolean, default: false },
    
    /**
     * @property {Object} metadata - Flexible storage for additional magazine attributes
     * - featured: Whether this is a featured issue
     * - pageCount: Number of pages in the magazine
     * - keywords: Array of searchable keywords
     */
    metadata: { type: Object, default: {} },
    
    /**
     * @property {Boolean} published - Whether the magazine is publicly available
     */
    published: { type: Boolean, default: true }
  },
  { timestamps: true } // Auto-manages createdAt and updatedAt fields
);

/**
 * Create indexing on frequently queried fields for better performance
 */
magazineSchema.index({ issue: 1 });
magazineSchema.index({ published: 1, createdAt: -1 });
magazineSchema.index({ price: 1 }); // For filtering by price ranges

/**
 * @constant {mongoose.Model} Magazine
 * @description Mongoose model for digital magazine publications
 */
export default mongoose.model('Magazine', magazineSchema);
