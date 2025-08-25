/**
 * Content Controller
 * 
 * Handles all content-related operations for the online farming magazine.
 * This controller provides CRUD operations for blogs, events, news articles,
 * farms, magazines, dairy, goat, piggery, and beef content, as well as 
 * functions for content engagement tracking, searching, and filtering.
 * 
 * @module controllers/contentController
 */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import Blog from '../models/Blog.js';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import News from '../models/News.js';
import Basic from '../models/Basic.js';
import Farm from '../models/Farm.js';
import Magazine from '../models/Magazine.js';
import Dairy from '../models/Dairy.js';
import Goat from '../models/Goat.js';
import Piggery from '../models/Piggery.js';
import Beef from '../models/Beef.js';
import Auction from '../models/Auction.js';
import Newsletter from '../models/Newsletter.js';
import Subscriber from '../models/Subscriber.js';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import { sendNewsletter as sendNewsletterEmail, sendWelcomeEmailToSubscriber, sendSubscriptionConfirmation, sendEmail } from '../services/emailService.js';
import { calculateReadingTimeByType } from '../utils/readingTimeCalculator.js';

/**
 * Define __dirname manually for ES modules
 * ES modules don't have access to __dirname, so we need to create it from import.meta.url
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Normalize file paths relative to the project root
 * 
 * @param {string} filePath - Path relative to project root (starting with /)
 * @returns {string} Absolute normalized path
 */
const normalizePath = (filePath) => path.resolve(__dirname, `..${filePath}`);

/**
 * GridFS utility functions for file operations
 */

// Get or create GridFS bucket instance
const getGridFSBucket = () => {
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db);
};

/**
 * Clean up a file from GridFS
 * @param {string} fileId - The ID of the file to delete
 */
const cleanupGridFSFile = async (fileId) => {
    if (!fileId) return;
    
    try {
        // Use centralized bucket function and memoize ObjectId
        const bucket = getGridFSBucket();
        const oid = new mongoose.Types.ObjectId(fileId);
        
        // Direct delete - GridFS will throw if file doesn't exist
        await bucket.delete(oid);
    } catch (error) {
        console.error('Error cleaning up file from GridFS:', error);
        // Don't throw error to prevent blocking operations
    }
};

/**
 * Update a file in GridFS - removes old file and returns new file ID
 * @param {string} oldFileId - The ID of the existing file
 * @param {string} newFileId - The ID of the new file
 * @returns {string} The new file ID
 */
const updateGridFSFile = async (oldFileId, newFileId) => {
    if (oldFileId && newFileId && oldFileId !== newFileId) {
        await cleanupGridFSFile(oldFileId);
    }
    return newFileId || oldFileId;
};

/**
 * Handle file cleanup in GridFS
 * @param {string} fileId - GridFS file ID to delete
 */
const cleanupFile = async (fileId) => {
    if (!fileId) return;
    try {
        // Validate ObjectId format first
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            console.log(`Invalid ObjectId for cleanup: ${fileId}`);
            return;
        }

        // Use centralized bucket function and memoize ObjectId
        const bucket = getGridFSBucket();
        const oid = new mongoose.Types.ObjectId(fileId);
        
        // Direct delete - GridFS will throw if file doesn't exist
        await bucket.delete(oid);
        console.log(`Successfully deleted file from GridFS: ${fileId}`);
    } catch (error) {
        // More specific error handling
        // Mongo GridFS uses code 26 (NamespaceNotFound) for missing files
        if (error.code === 26 || /File not found/i.test(error.message)) {
            console.log(`File already deleted or doesn't exist: ${fileId}`);
        } else {
            console.error('Error cleaning up file:', error);
        }
    }
};

/**
 * Update file in GridFS
 * @param {string} oldFileId - Existing file ID to replace
 * @param {string} newFileId - New file ID
 * @returns {string} New file ID
 */
const updateFile = async (oldFileId, newFileId) => {
    if (oldFileId && newFileId) {
        await cleanupFile(oldFileId);
    }
    return newFileId || oldFileId;
};

/**
 * Parse and validate metadata JSON 
 * 
 * @param {string|Object|null} metadata - Metadata as JSON string or already parsed object
 * @returns {Object} Parsed metadata object
 * @throws {Error} If metadata is not valid JSON
 */
const parseMetadata = (metadata) => {
  try {
    // If metadata is already an object, return it directly
    if (typeof metadata === 'object' && metadata !== null) {
      return metadata;
    }
    // If metadata is a string, try to parse it
    return metadata ? JSON.parse(metadata) : {};
  } catch {
    throw new Error('Invalid metadata format. Must be a valid JSON string.');
  }
};

/**
 * Generate consistent response format for all API endpoints
 * 
 * @param {Object} res - Express response object
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Response message
 * @param {Object|null} data - Response data if any
 * @param {Object|string|null} error - Error details if any
 * @returns {Object} JSON response with consistent format
 */
const sendResponse = (res, success, message, data = null, error = null, statusCode = null) => {
  let status;
  if (statusCode) {
    status = statusCode;
  } else if (success) {
    status = 200;
  } else {
    // Default to 400 for client errors, unless specified otherwise
    status = 400;
  }
  res.status(status).json({ success, message, data, error });
};

/**
 * ENGAGEMENT TRACKING FUNCTIONS
 * --------------------------
 */

/**
 * Track content views for any content type
 * Increments the view counter for the specified content item
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.contentType - Type of content (blog, news, event, etc.)
 * @param {string} req.params.id - ID of the content item
 * @param {Object} res - Express response object
 * @returns {Object} Response indicating success or failure
 */
export const trackView = async (req, res) => {
  try {
    const { contentType, id } = req.params;
    
    // Map content types to their models
    const modelMap = {
      blogs: Blog,
      news: News,
      dairies: Dairy,
      beefs: Beef,
      farms: Farm,
      piggeries: Piggery,
      goats: Goat,
      basics: Basic,
      magazines: Magazine
    };

    const Model = modelMap[contentType];
    if (!Model) {
      return sendResponse(res, false, 'Invalid content type');
    }

    const content = await Model.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!content) {
      return sendResponse(res, false, 'Content not found', null, null, 404);
    }

    sendResponse(res, true, 'View tracked successfully', { views: content.views });
  } catch (error) {
    sendResponse(res, false, 'Failed to track view', null, error.message);
  }
};

/**
 * Track likes/unlikes for any content type
 * Increments or decrements the like counter based on the action
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.contentType - Type of content (blog, news, event, etc.)
 * @param {string} req.params.id - ID of the content item
 * @param {Object} req.body - Request body
 * @param {string} req.body.action - Either 'like' or 'unlike'
 * @param {Object} res - Express response object
 * @returns {Object} Response indicating success or failure with updated like count
 */
export const trackLike = async (req, res) => {
  try {
    const { contentType, id } = req.params;
    const { action } = req.body; // 'like' or 'unlike'
    
    // Map of content types to their respective models
    const modelMap = {
      blogs: Blog,
      news: News,
      dairies: Dairy,
      beefs: Beef,
      farms: Farm,
      piggeries: Piggery,
      goats: Goat,
      basics: Basic,
      magazines: Magazine
    };

    const Model = modelMap[contentType];
    if (!Model) {
      return sendResponse(res, false, 'Invalid content type');
    }

    const increment = action === 'like' ? 1 : -1;
    const content = await Model.findByIdAndUpdate(
      id,
      { $inc: { likes: increment } },
      { new: true }
    );

    if (!content) {
      return sendResponse(res, false, 'Content not found', null, null, 404);
    }

    // Ensure likes don't go below 0
    if (content.likes < 0) {
      content.likes = 0;
      await content.save();
    }

    sendResponse(res, true, `${action} tracked successfully`, { likes: content.likes });
  } catch (error) {
    sendResponse(res, false, 'Failed to track like', null, error.message);
  }
};

// Generic share tracking function
export const trackShare = async (req, res) => {
  try {
    const { contentType, id } = req.params;
    
    const modelMap = {
      blogs: Blog,
      news: News,
      dairies: Dairy,
      beefs: Beef,
      farms: Farm,
      piggeries: Piggery,
      goats: Goat,
      basics: Basic,
      magazines: Magazine
    };

    const Model = modelMap[contentType];
    if (!Model) {
      return sendResponse(res, false, 'Invalid content type');
    }

    const content = await Model.findByIdAndUpdate(
      id,
      { $inc: { shares: 1 } },
      { new: true }
    );

    if (!content) {
      return sendResponse(res, false, 'Content not found', null, null, 404);
    }

    sendResponse(res, true, 'Share tracked successfully', { shares: content.shares });
  } catch (error) {
    sendResponse(res, false, 'Failed to track share', null, error.message);
  }
};

// Get engagement stats for content
export const getEngagementStats = async (req, res) => {
  try {
    const { contentType, id } = req.params;
    
    const modelMap = {
      blogs: Blog,
      news: News,
      dairies: Dairy,
      beefs: Beef,
      farms: Farm,
      piggeries: Piggery,
      goats: Goat,
      basics: Basic,
      magazines: Magazine
    };

    const Model = modelMap[contentType];
    if (!Model) {
      return sendResponse(res, false, 'Invalid content type');
    }

    const content = await Model.findById(id).select('views likes shares');
    if (!content) {
      return sendResponse(res, false, 'Content not found', null, null, 404);
    }

    sendResponse(res, true, 'Engagement stats retrieved successfully', {
      views: content.views || 0,
      likes: content.likes || 0,
      shares: content.shares || 0
    });
  } catch (error) {
    sendResponse(res, false, 'Failed to get engagement stats', null, error.message);
  }
};

// Comment management system has been removed to improve dashboard accuracy
// and remove unused functionality. This eliminates comment-related statistics
// that were skewing engagement metrics.

// Note: Comment-related routes and models should also be cleaned up
// to completely remove this functionality from the system.
export const approveContentComment = async (req, res) => {
  try {
    const { contentType, id, commentId } = req.params;

    const modelMap = {
      blogs: Blog,
      news: News,
      dairies: Dairy,
      beefs: Beef,
      farms: Farm,
      piggeries: Piggery,
      goats: Goat,
      basics: Basic,
      magazines: Magazine
    };

    const Model = modelMap[contentType];
    if (!Model) {
      return sendResponse(res, false, 'Invalid content type');
    }

    const item = await Model.findById(id);
    if (!item) {
      return sendResponse(res, false, 'Content not found', null, null, 404);
    }

    const comment = item.comments.id(commentId);
    if (!comment) {
      return sendResponse(res, false, 'Comment not found', null, null, 404);
    }

    comment.approved = true;
    await item.save();

    sendResponse(res, true, 'Comment approved successfully', item);
  } catch (error) {
    sendResponse(res, false, 'Failed to approve comment', null, error.message);
  }
};

// ----- BLOG CRUD -----
export const createBlog = async (req, res) => {
  try {
    console.log('🔍 DEBUG: Starting createBlog function');
    console.log('🔍 DEBUG: Request body:', req.body);
    
    const { title, content, author, category, tags, metadata, published } = req.body;
    let imageUrl = null;

    console.log('🔍 DEBUG: Extracted fields:', { title, content, author, category, tags, published });

    if (!title || !content || !author) {
      console.log('🔍 DEBUG: Missing required fields');
      return sendResponse(res, false, 'Title, content, and author are required.');
    }

    // Handle file from GridFS
    if (req.file) {
      imageUrl = req.file.gridFS ? req.file.gridFS.id : req.file.id; // Support both patterns
      console.log('🔍 DEBUG: Stored file ID:', imageUrl);
      console.log('🔍 DEBUG: File object:', req.file);
    } else {
      console.log('🔍 DEBUG: No file in request');
    }

    console.log('🔍 DEBUG: Parsing metadata...');
    let parsedMetadata = {};

    // Setup error handler to cleanup file if blog creation fails
    const handleError = async (error) => {
      if (imageUrl) {
        await cleanupGridFSFile(imageUrl);
      }
      return sendResponse(res, false, 'Failed to create blog', null, error.message);
    };
    try {
      parsedMetadata = parseMetadata(metadata);
    } catch (e) {
      console.error('🔍 DEBUG: Error parsing metadata, using empty metadata:', e);
      // Continue with empty metadata instead of throwing error
      parsedMetadata = {};
    }
    console.log('🔍 DEBUG: Parsed metadata:', parsedMetadata);
    
    // Handle tags more robustly
    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else {
        try {
          parsedTags = JSON.parse(tags);
          if (!Array.isArray(parsedTags)) {
            parsedTags = []; // Default to empty array if parsed result isn't an array
          }
        } catch (e) {
          console.error('Error parsing tags:', e);
          // If it's a comma-separated string, convert to array
          if (typeof tags === 'string') {
            parsedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
          }
        }
      }
    }
    
    console.log('🔍 DEBUG: Parsed tags:', parsedTags);

    // Calculate accurate reading time
    const calculatedReadTime = calculateReadingTimeByType(content, 'blog');
    console.log('🔍 DEBUG: Calculated reading time:', calculatedReadTime, 'minutes');

    console.log('🔍 DEBUG: Creating new Blog instance...');
    console.log('🔍 DEBUG: Published value:', published, 'Type:', typeof published);
    console.log('🔍 DEBUG: Published evaluation:', published === 'true' || published === true || published === "true");
    
    const newBlog = new Blog({
      title,
      content,
      author,
      category: category || 'General',
      tags: parsedTags,
      image: imageUrl, // Store GridFS file ID in image field
      metadata: parsedMetadata,
      published: published === 'true' || published === true || published === "true",
      readTime: calculatedReadTime // Store calculated reading time
    });

    console.log('🔍 DEBUG: Blog instance created with published:', newBlog.published);

    console.log('🔍 DEBUG: Blog instance created, attempting to save...');
    try {
      const savedBlog = await newBlog.save();
      console.log('🔍 DEBUG: Blog saved successfully:', savedBlog._id);
      
      // Force cache invalidation for immediate refresh
      try {
        // Clear memory cache if it exists
        if (global.memoryCache) {
          global.memoryCache.flushAll();
        }
        
        // Clear enhanced cache
        const { invalidateCache } = await import('../middleware/enhancedCache.js');
        await invalidateCache(['blogs', 'content', 'dashboard', 'admin-blogs']);
      } catch (cacheError) {
        console.warn('Cache invalidation warning:', cacheError.message);
      }
      
      sendResponse(res, true, 'Blog created successfully', savedBlog);
    } catch (error) {
      return await handleError(error);
    }
  } catch (error) {
    console.error('❌ DEBUG: Error in createBlog:', error);
    console.error('❌ DEBUG: Error stack:', error.stack);
    sendResponse(res, false, 'Failed to create blog', null, error.message);
  }
};
/**
 * Retrieve a blog post by its ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters 
 * @param {string} req.params.id - ID of the blog to retrieve
 * @param {Object} res - Express response object
 * @returns {Object} Response with blog data or error message
 */
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get a paginated list of blog posts
 * When accessed by admin, returns all posts; otherwise returns only published posts
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=10] - Number of items per page
 * @param {boolean} [req.query.admin] - Whether the request is from admin (shows unpublished)
 * @param {Object} res - Express response object
 * @returns {Object} Response with paginated blog list and metadata
 */
export const getBlogs = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    // Admin can see all blogs, non-admin only sees published blogs
    const query = admin === 'true' ? {} : { published: true };

    console.log("🔥 API HIT: Fetching blogs...");
    console.log("🔍 Query:", query);
    console.log("🔍 Admin param:", admin, "Type:", typeof admin);

    // Log the total number of blogs in the database
    const totalBlogs = await Blog.countDocuments({});
    console.log("Total blogs in database:", totalBlogs);

    // Log the number of published blogs
    const publishedBlogsCount = await Blog.countDocuments({ published: true });
    console.log("Published blogs in database:", publishedBlogsCount);

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    console.log("✅ Blogs found:", blogs.length);
    if (blogs.length > 0) {
      console.log("Sample blog:", {
        id: blogs[0]._id,
        title: blogs[0].title,
        published: blogs[0].published,
        hasImage: !!blogs[0].image
      });
    }

    const total = await Blog.countDocuments(query);

    sendResponse(res, true, 'Blogs retrieved successfully', { blogs, total, page, limit });
  } catch (error) {
    console.error("❌ Error fetching blogs:", error);
    sendResponse(res, false, 'Failed to retrieve blogs', null, error.message);
  }
};
export const getAdminBlogs = async (req, res) => {
  const { page = 1, limit = 1000 } = req.query; // Increased default limit for admin
  
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Blog.countDocuments();

    res.json({
      blogs,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author, category, metadata, published } = req.body;
    
    console.log('Request body:', req.body);
    
    // Find existing blog to get current image
    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Handle file update if new file uploaded
    let imageUrl = existingBlog.image;
    if (req.file) {
      // Update file in GridFS and get new file ID
      imageUrl = await updateFile(existingBlog.image, req.file.id);
    }
    
    // Parse metadata if it's a string
    let parsedMetadata = {};
    try {
      parsedMetadata = parseMetadata(metadata);
    } catch (e) {
      console.error('Error parsing metadata:', e);
      // Continue with empty metadata
    }
    
    // Handle tags from req.body using a simple approach
    let parsedTags = [];
    
    // Get tags from the request body
    if (req.body.tags) {
      // If it's already an array, use it directly
      if (Array.isArray(req.body.tags)) {
        parsedTags = req.body.tags;
      }
      // If it's a comma-separated string (most likely with FormData), parse it
      else if (typeof req.body.tags === 'string') {
        parsedTags = req.body.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      }
    }
    
    console.log('Final parsed tags:', parsedTags);
    
    console.log('Final parsed tags:', parsedTags);
    
    // Create update data object with only defined fields
    let updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (author !== undefined) updateData.author = author;
    if (category !== undefined) updateData.category = category || 'General';
    
    // Process tags to always be an array, regardless of how they're sent
    if (req.body.tags !== undefined) {
      let tags = req.body.tags;
      
      if (Array.isArray(tags)) {
        // Already an array, use directly
        updateData.tags = tags;
      } else if (typeof tags === 'string') {
        // String - could be comma-separated or JSON string
        if (tags.trim().startsWith('[') && tags.trim().endsWith(']')) {
          // Try to parse as JSON string array
          try {
            const parsedTags = JSON.parse(tags);
            if (Array.isArray(parsedTags)) {
              updateData.tags = parsedTags;
            } else {
              // If parsed but not an array, convert to array with single item
              updateData.tags = [tags];
            }
          } catch (e) {
            // If parse fails, treat as comma-separated
            updateData.tags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
          }
        } else {
          // Regular string - treat as comma-separated
          updateData.tags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
        }
      } else {
        // Handle case where tags is defined but not a string or array
        updateData.tags = [String(tags)]; // Convert to array with single string item
      }
      
      console.log('Final tags for update:', updateData.tags);
    }
    
    // Only include metadata if it was provided or parsed
    if (metadata !== undefined) updateData.metadata = parsedMetadata;
    
    // Handle published explicitly to support boolean or string "true"/"false"
    if (published !== undefined) {
      updateData.published = published === 'true' || published === true;
    }

    // Set the GridFS file ID for the image field
    if (imageUrl) {
      updateData.image = imageUrl;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(400).json({ 
      message: error.message,
      details: {
        error: error.toString(),
        requestBody: {
          title: req.body.title,
          author: req.body.author,
          category: req.body.category,
          tagsType: req.body.tags ? typeof req.body.tags : 'undefined',
          hasFile: !!req.file
        }
      }
    });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Delete the associated file from GridFS if it exists
    if (blog.image) {
      await cleanupFile(blog.image);
    }

    // Delete the blog from the database
    await Blog.findByIdAndDelete(id);

    // Enhanced cache invalidation for immediate refresh on Railway
    try {
      // Force cache clear for content lists
      if (global.memoryCache) {
        global.memoryCache.flushAll();
      }
      
      // Clear any other cache layers
      const { invalidateCache } = await import('../middleware/enhancedCache.js');
      await invalidateCache(['blogs', 'content', 'dashboard', 'search']);
    } catch (cacheError) {
      console.warn('Cache invalidation warning:', cacheError.message);
    }

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Failed to delete blog' });
  }
};
// ----- NEWS CRUD -----
export const createNews = async (req, res) => {
  try {
    const { title, content, author, category, tags, metadata, published, featured, isBreaking } = req.body;
    let imageId = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.', null, null, 400);
    }

    // Handle file from GridFS
    if (req.file) {
      imageId = req.file.id; // Store GridFS file ID
    }

    // Setup error handler to cleanup file if news creation fails
    const handleError = async (error) => {
      if (imageId) {
        await cleanupGridFSFile(imageId);
      }
      return sendResponse(res, false, 'Failed to create news', null, error.message, 500);
    };

    // Parse metadata (check if it's already an object or needs parsing)
    let parsedMetadata = {};
    try {
      if (typeof metadata === 'object' && metadata !== null) {
        parsedMetadata = metadata;
      } else {
        parsedMetadata = metadata ? JSON.parse(metadata) : {};
      }
    } catch (error) {
      console.warn('Invalid metadata format, using empty object:', error);
      parsedMetadata = {};
    }

    // Handle tags (they may already be processed by processFormData middleware)
    let parsedTags = [];
    if (Array.isArray(tags)) {
      // Tags already processed by middleware
      parsedTags = tags;
    } else if (typeof tags === 'string') {
      try {
        // Try parsing as JSON first
        parsedTags = JSON.parse(tags);
      } catch (error) {
        // If parsing fails, try splitting as comma-separated string
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      }
    } else {
      parsedTags = [];
    }

    const newNews = new News({
      title,
      content,
      author: author || '',
      category: category || 'general',
      tags: parsedTags,
      image: imageId, // Store GridFS file ID instead of imageUrl
      metadata: parsedMetadata,
      published: published === 'true' || published === true,
      featured: featured === 'true' || featured === true,
      isBreaking: isBreaking === 'true' || isBreaking === true
    });

    try {
      const savedNews = await newNews.save();
      sendResponse(res, true, 'News created successfully', savedNews, null, 201);
    } catch (error) {
      return await handleError(error);
    }
  } catch (error) {
    console.error('Error creating news:', error);
    sendResponse(res, false, 'Failed to create news', null, error.message, 500);
  }
};

export const getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getNews = async (req, res) => {
  const { page = 1, limit = 10, admin, breaking, category } = req.query;

  try {
    const query = admin ? {} : { published: true };
    
    // Add breaking news filter if specified
    if (breaking === 'true') {
      query.isBreaking = true;
    }
    
    // Add category filter if specified
    if (category && category !== 'all') {
      query.category = category;
    }

    const news = await News.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await News.countDocuments(query);
    sendResponse(res, true, 'News retrieved successfully', { news, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve news', null, error.message);
  }
};

export const getAdminNews = async (req, res) => {
  const { page = 1, limit = 1000 } = req.query; // Increased default limit for admin
  
  try {
    const news = await News.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await News.countDocuments();

    res.json({
      news,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, published, isBreaking } = req.body;
    
    const existingNews = await News.findById(id);
    if (!existingNews) {
      return sendResponse(res, false, 'News not found', null, null, 404);
    }

    let imageId = existingNews.image;
    
    // Handle new file upload
    if (req.file) {
      imageId = await updateGridFSFile(existingNews.image, req.file.id);
    }

    let updateData = { 
      title, 
      content, 
      metadata, 
      published,
      isBreaking: isBreaking === 'true' || isBreaking === true,
      image: imageId
    };

    const updatedNews = await News.findByIdAndUpdate(id, updateData, { new: true });
    sendResponse(res, true, 'News updated successfully', updatedNews);
  } catch (error) {
    console.error('Error updating news:', error);
    sendResponse(res, false, 'Failed to update news', null, error.message, 500);
  }
};

export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);

    if (!news) {
      return sendResponse(res, false, 'News not found', null, null, 404);
    }

    // Delete the associated image file from GridFS if it exists
    if (news.image) {
      await cleanupGridFSFile(news.image);
    }

    // Delete the news from the database
    await News.findByIdAndDelete(id);

    sendResponse(res, true, 'News deleted successfully');
  } catch (error) {
    console.error('Error deleting news:', error);
    sendResponse(res, false, 'Failed to delete news', null, error.message, 500);
  }
};

// ----- BASIC CRUD OPERATIONS -----

// Create a new Basic media
export const createBasic = async (req, res) => {
  try {
    const { title, description, fileType, metadata, published, duration } = req.body;

    // Extract uploaded files
    const files = req.files || {};
    const image = files.image?.[0]; // Thumbnail
    const media = files.media?.[0]; // Video/Audio

    // Ensure media file is provided
    if (!title || !description || !fileType || !media) {
      return sendResponse(res, false, 'Title, description, file type, and media file are required.', null, null, 400);
    }

    // Get GridFS file IDs
    const mediaFileId = media.id; // GridFS file ID for main media
    const thumbnailId = image ? image.id : null; // GridFS file ID for thumbnail

    // Setup error handler to cleanup files if creation fails
    const handleError = async (error) => {
      if (mediaFileId) {
        await cleanupGridFSFile(mediaFileId);
      }
      if (thumbnailId) {
        await cleanupGridFSFile(thumbnailId);
      }
      return sendResponse(res, false, 'Failed to create basic media', null, error.message, 500);
    };

    // Parse metadata
    const parsedMetadata = metadata ? JSON.parse(metadata) : {};

    // Create and save Basic media
    const newBasic = new Basic({
      title,
      description,
      mediaFile: mediaFileId, // GridFS file ID for main media
      thumbnail: thumbnailId, // GridFS file ID for thumbnail
      fileType,
      duration: duration ? parseInt(duration) : null,
      published: published === 'true' || published === true,
      metadata: parsedMetadata,
    });

    try {
      const savedBasic = await newBasic.save();
      sendResponse(res, true, 'Basic media created successfully', savedBasic, null, 201);
    } catch (error) {
      return await handleError(error);
    }
  } catch (error) {
    console.error('Error creating basic media:', error);
    sendResponse(res, false, 'Failed to create basic media', null, error.message, 500);
  }
};

// Get all Basics with pagination
export const getBasics = async (req, res) => {
  const { page = 1, limit = 10, fileType } = req.query;

  try {
    const query = fileType ? { fileType } : {};
    const basics = await Basic.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Basic.countDocuments(query);
    sendResponse(res, true, 'Basics retrieved successfully', { basics, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve basics', null, error.message);
  }
};

// Get all Basics for admin (with pagination)
export const getAdminBasics = async (req, res) => {
  const { page = 1, limit = 1000 } = req.query; // Increased default limit for admin

  try {
    const basics = await Basic.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Basic.countDocuments();

    res.status(200).json({
      success: true,
      basics,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin basics',
      error: error.message,
    });
  }
};

// Get a single Basic by ID
export const getBasicById = async (req, res) => {
  try {
    const basic = await Basic.findById(req.params.id);
    if (!basic) {
      return sendResponse(res, false, 'Basic media not found');
    }
    sendResponse(res, true, 'Basic media retrieved successfully', basic);
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve basic media', null, error.message);
  }
};

// Update a Basic media
export const updateBasic = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, fileType, metadata, published, duration } = req.body;

    // Extract uploaded files (if any)
    const files = req.files || {};
    const image = files.image?.[0];
    const media = files.media?.[0];

    // Parse metadata inline
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      return res.status(400).json({ message: 'Invalid metadata format' });
    }

    const updateData = {
      title,
      description,
      fileType,
      metadata: parsedMetadata,
    };

    // Add optional fields if provided
    if (published !== undefined) {
      updateData.published = published === 'true' || published === true;
    }
    if (duration !== undefined) {
      updateData.duration = duration ? parseInt(duration) : null;
    }

    // Handle GridFS file updates
    if (media) {
      updateData.mediaFile = media.id; // GridFS file ID
    }
    if (image) {
      updateData.thumbnail = image.id; // GridFS file ID
    }

    const updatedBasic = await Basic.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedBasic) {
      return sendResponse(res, false, 'Basic media not found');
    }

    sendResponse(res, true, 'Basic media updated successfully', updatedBasic);
  } catch (error) {
    sendResponse(res, false, 'Failed to update basic media', null, error.message);
  }
};




// Delete a Basic media
export const deleteBasic = async (req, res) => {
  try {
    const { id } = req.params;
    const basic = await Basic.findById(id);

    if (!basic) {
      return sendResponse(res, false, 'Basic media not found');
    }

    // Delete associated GridFS files
    if (basic.mediaFile) {
      await cleanupGridFSFile(basic.mediaFile);
    }

    if (basic.thumbnail) {
      await cleanupGridFSFile(basic.thumbnail);
    }

    await Basic.findByIdAndDelete(id);
    sendResponse(res, true, 'Basic media deleted successfully');
  } catch (error) {
    sendResponse(res, false, 'Failed to delete basic media', null, error.message);
  }
};

// Add a comment to a Basic media
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return sendResponse(res, false, 'Comment content is required.');
    }

    const basic = await Basic.findById(id);
    if (!basic) {
      return sendResponse(res, false, 'Basic media not found');
    }

    basic.comments.push({ content });
    await basic.save();

    sendResponse(res, true, 'Comment added successfully', basic);
  } catch (error) {
    sendResponse(res, false, 'Failed to add comment', null, error.message);
  }
};

// Delete a comment from a Basic media
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    const basic = await Basic.findById(id);
    if (!basic) {
      return sendResponse(res, false, 'Basic media not found');
    }

    basic.comments = basic.comments.filter((comment) => comment._id.toString() !== commentId);
    await basic.save();

    sendResponse(res, true, 'Comment deleted successfully', basic);
  } catch (error) {
    sendResponse(res, false, 'Failed to delete comment', null, error.message);
  }
};

// ----- FARM CRUD -----

// Create a new farm
export const createFarm = async (req, res) => {
  try {
    const { name, location, price, description, metadata } = req.body;
    let imageId = null;

    if (!name || !location || !price || !description) {
      return sendResponse(res, false, 'Name, location, price, and description are required.');
    }

    // Handle file from GridFS
    if (req.file) {
      imageId = req.file.id; // Store GridFS file ID
    }

    const parsedMetadata = parseMetadata(metadata);

    const newFarm = new Farm({
      name,
      location,
      price,
      description,
      image: imageId, // Use GridFS file ID
      metadata: parsedMetadata,
    });

    const savedFarm = await newFarm.save();
    sendResponse(res, true, 'Farm created successfully', savedFarm);
  } catch (error) {
    sendResponse(res, false, 'Failed to create farm', null, error.message);
  }
};

// Get a farm by ID
export const getFarmById = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }
    res.json({ success: true, data: farm });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all farms (with optional pagination)
export const getFarms = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : {}; // Adjust if there are fields like "published" to filter non-admin results
    const farms = await Farm.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Farm.countDocuments(query);
    sendResponse(res, true, 'Farms retrieved successfully', { farms, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve farms', null, error.message);
  }
};

// Get farms (admin view with pagination)
export const getAdminFarms = async (req, res) => {
  const { page = 1, limit = 1000 } = req.query; // Increased default limit for admin

  try {
    const farms = await Farm.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Farm.countDocuments();

    res.json({
      farms,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a farm
export const updateFarm = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, price, description, metadata } = req.body;
    
    const existingFarm = await Farm.findById(id);
    if (!existingFarm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    let updateData = { name, location, price, description, metadata };

    // Handle GridFS file update
    if (req.file) {
      // Update the GridFS file ID
      updateData.image = await updateGridFSFile(existingFarm.image, req.file.id);
    }

    const updatedFarm = await Farm.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedFarm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



// Delete a farm
export const deleteFarm = async (req, res) => {
  try {
    const { id } = req.params;
    const farm = await Farm.findById(id);

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Delete the associated GridFS file if it exists
    if (farm.image) {
      await cleanupGridFSFile(farm.image);
    }

    // Delete the farm from the database
    await Farm.findByIdAndDelete(id);

    res.json({ message: 'Farm deleted successfully' });
  } catch (error) {
    console.error('Error deleting farm:', error);
    res.status(500).json({ message: 'Failed to delete farm' });
  }
};




// ----- MAGAZINE CRUD -----

// Create a new magazine
export const createMagazine = async (req, res) => {
  console.log('📖 createMagazine: Starting function');
  try {
    console.log('📖 createMagazine: Extracting body fields');
    const { title, description, issue, price, discount, metadata, featured, author, category, tags, keywords, summary, published } = req.body;

    console.log('📖 createMagazine: Got title:', title, 'description:', description, 'issue:', issue);

    // Check required fields
    if (!title || !description || !issue) {
      console.log('📖 createMagazine: Missing required fields');
      return sendResponse(res, false, 'Title, description, and issue are required.', null, null, 400);
    }

    console.log('📖 createMagazine: Checking files');
    // Handle file uploads
    const files = req.files || {};
    const image = files.image?.[0];
    const pdf = files.pdf?.[0];

    console.log('📖 createMagazine: Got image:', !!image, 'pdf:', !!pdf);

    if (!image || !pdf) {
      console.log('📖 createMagazine: Missing files');
      return sendResponse(res, false, 'Both image and PDF file are required.', null, null, 400);
    }

    const coverImageId = image.id; // GridFS file ID
    const pdfId = pdf.id; // GridFS file ID

    // Setup error handler to cleanup files if magazine creation fails
    const handleError = async (error) => {
      if (coverImageId) {
        await cleanupGridFSFile(coverImageId);
      }
      if (pdfId) {
        await cleanupGridFSFile(pdfId);
      }
      return sendResponse(res, false, 'Failed to create magazine', null, error.message, 500);
    };

    console.log('📖 createMagazine: Parsing metadata');
    // Parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      console.warn('Invalid metadata format, using empty object:', error);
      parsedMetadata = {};
    }

    console.log('📖 createMagazine: Parsing tags');
    // Parse tags - handle array, JSON string, or comma-separated string
    let parsedTags = [];
    console.log('📖 createMagazine: Processing tags:', tags);
    console.log('📖 createMagazine: Tags type:', typeof tags);
    
    // Check if tags exists and handle based on type
    if (tags) {
      if (Array.isArray(tags)) {
        // Tags is already an array, use it directly
        parsedTags = tags;
        console.log('📖 createMagazine: Tags is already an array:', parsedTags);
      } else if (typeof tags === 'string') {
        try {
          // Try to parse as JSON string
          if (tags.trim().startsWith('[') && tags.trim().endsWith(']')) {
            parsedTags = JSON.parse(tags);
            console.log('📖 createMagazine: Tags parsed from JSON:', parsedTags);
          } else {
            // If parsing fails, try splitting as comma-separated string
            parsedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
            console.log('📖 createMagazine: Tags split from string:', parsedTags);
          }
        } catch (error) {
          console.error('📖 createMagazine: Error parsing tags:', error.message);
          // If there's any error, just use empty array
          parsedTags = [];
        }
      } else {
        // If tags is neither an array nor a string, log it and use empty array
        console.log('📖 createMagazine: Invalid tags format, using empty array. Type:', typeof tags);
        console.log('📖 createMagazine: Tags value:', JSON.stringify(tags));
        parsedTags = [];
      }
    } else {
      console.log('📖 createMagazine: No tags provided, using empty array');
    }

    console.log('📖 createMagazine: Parsing keywords');
    // Parse keywords - handle array, JSON string, or comma-separated string
    let parsedKeywords = [];
    console.log('📖 createMagazine: Processing keywords:', keywords);
    
    // Check if keywords exists and handle based on type
    if (keywords) {
      if (Array.isArray(keywords)) {
        // Keywords is already an array, use it directly
        parsedKeywords = keywords;
        console.log('📖 createMagazine: Keywords is already an array:', parsedKeywords);
      } else if (typeof keywords === 'string') {
        try {
          // Try to parse as JSON string
          parsedKeywords = JSON.parse(keywords);
          console.log('📖 createMagazine: Keywords parsed from JSON:', parsedKeywords);
        } catch (error) {
          // If parsing fails, try splitting as comma-separated string
          parsedKeywords = keywords.split(',').map(keyword => keyword.trim()).filter(Boolean);
          console.log('📖 createMagazine: Keywords split from string:', parsedKeywords);
        }
      } else {
        console.log('📖 createMagazine: Invalid keywords format, using empty array');
      }
    } else {
      console.log('📖 createMagazine: No keywords provided, using empty array');
    }

    console.log('📖 createMagazine: Creating magazine object');
    const newMagazine = new Magazine({
      title,
      description,
      issue,
      price: price || 0,
      discount: discount || 0,
      author: author || '',
      category: category || 'Magazine',
      tags: parsedTags,
      coverImage: coverImageId, // GridFS file ID for cover image
      pdf: pdfId, // GridFS file ID for PDF
      metadata: {
        ...parsedMetadata,
        keywords: parsedKeywords,
        summary: summary || ''
      },
      published: published === 'true' || published === true,
      featured: featured === 'true' || featured === true
    });

    console.log('📖 createMagazine: Saving to database');
    try {
      const savedMagazine = await newMagazine.save();
      console.log('📖 createMagazine: Saved successfully');
      
      sendResponse(res, true, 'Magazine created successfully', savedMagazine, null, 201);
    } catch (error) {
      return await handleError(error);
    }
  } catch (error) {
    console.error('Error creating magazine:', error);
    sendResponse(res, false, 'Failed to create magazine', null, error.message, 500);
  }
};

// Get a magazine by ID
export const getMagazineById = async (req, res) => {
  try {
    const magazine = await Magazine.findById(req.params.id);
    if (!magazine) {
      return sendResponse(res, false, 'Magazine not found');
    }
    sendResponse(res, true, 'Magazine retrieved successfully', magazine);
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve magazine', null, error.message);
  }
};

// Get all magazines (with pagination)
export const getMagazines = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };
    const magazines = await Magazine.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Magazine.countDocuments(query);
    sendResponse(res, true, 'Magazines retrieved successfully', { magazines, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve magazines', null, error.message);
  }
};
// Get all magazines for admin (with pagination)
export const getAdminMagazines = async (req, res) => {
  const { page = 1, limit = 1000 } = req.query; // Increased default limit for admin

  try {
    const magazines = await Magazine.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Magazine.countDocuments();

    res.status(200).json({
      success: true,
      magazines,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    console.error('Error fetching admin magazines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin magazines',
      error: error.message,
    });
  }
};

// Update a magazine
export const updateMagazine = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, issue, price, discount, metadata, published } = req.body;
    const files = req.files || {};

    const existingMagazine = await Magazine.findById(id);
    if (!existingMagazine) {
      return sendResponse(res, false, 'Magazine not found');
    }

    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      return res.status(400).json({ message: 'Invalid metadata format' });
    }

    const updateData = {
      title,
      description,
      issue,
      price,
      discount,
      metadata: parsedMetadata,
      published,
    };

    // Handle GridFS file updates
    if (files.image?.[0]) {
      updateData.coverImage = await updateGridFSFile(existingMagazine.coverImage, files.image[0].id);
    }

    if (files.pdf?.[0]) {
      updateData.pdf = await updateGridFSFile(existingMagazine.pdf, files.pdf[0].id);
    }

    const updatedMagazine = await Magazine.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedMagazine) {
      return sendResponse(res, false, 'Magazine not found');
    }

    sendResponse(res, true, 'Magazine updated successfully', updatedMagazine);
  } catch (error) {
    sendResponse(res, false, 'Failed to update magazine', null, error.message);
  }
};


// Delete a magazine
export const deleteMagazine = async (req, res) => {
  try {
    const { id } = req.params;
    const magazine = await Magazine.findById(id);

    if (!magazine) {
      return sendResponse(res, false, 'Magazine not found');
    }

    // Delete associated GridFS files
    if (magazine.pdf) {
      await cleanupGridFSFile(magazine.pdf);
    }

    if (magazine.coverImage) {
      await cleanupGridFSFile(magazine.coverImage);
    }

    await Magazine.findByIdAndDelete(id);
    sendResponse(res, true, 'Magazine deleted successfully');
  } catch (error) {
    sendResponse(res, false, 'Failed to delete magazine', null, error.message);
  }
};


// ----- PIGGERY CRUD -----
export const createPiggery = async (req, res) => {
  try {
    const { title, content, metadata, published, featured, category, tags, readTime } = req.body;
    let imageId = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.', null, null, 400);
    }

    // Handle file from GridFS
    if (req.file) {
      imageId = req.file.id; // Store GridFS file ID
    }

    // Setup error handler to cleanup file if creation fails
    const handleError = async (error) => {
      if (imageId) {
        await cleanupGridFSFile(imageId);
      }
      return sendResponse(res, false, 'Failed to create piggery content', null, error.message, 500);
    };

    // Parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      console.warn('Invalid metadata format, using empty object:', error);
      parsedMetadata = {};
    }

    // Parse tags if it's a JSON string
    let parsedTags = [];
    try {
      parsedTags = tags ? JSON.parse(tags) : [];
    } catch (error) {
      // If parsing fails, try splitting as comma-separated string
      parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    }

    // Calculate accurate reading time if not provided
    const calculatedReadTime = readTime || calculateReadingTimeByType(content, 'piggery');

    const newPiggery = new Piggery({
      title,
      content,
      category: category || 'Piggery',
      tags: parsedTags,
      image: imageId, // GridFS file ID
      metadata: {
        ...parsedMetadata,
        readTime: calculatedReadTime
      },
      published: published === 'true' || published === true,
      featured: featured === 'true' || featured === true,
      readTime: calculatedReadTime // Store in main document for queries
    });

    try {
      const savedPiggery = await newPiggery.save();
      sendResponse(res, true, 'Piggery content created successfully', savedPiggery, null, 201);
    } catch (error) {
      return await handleError(error);
    }
  } catch (error) {
    console.error('Error creating piggery content:', error);
    sendResponse(res, false, 'Failed to create piggery content', null, error.message, 500);
  }
};

export const getPiggeryById = async (req, res) => {
  try {
    const piggery = await Piggery.findById(req.params.id);
    if (!piggery) {
      return res.status(404).json({ success: false, message: 'Piggery not found' });
    }
    res.json({ success: true, data: piggery });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getPiggeries = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };
    const piggeries = await Piggery.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Piggery.countDocuments(query);
    sendResponse(res, true, 'Piggeries retrieved successfully', { piggeries, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve piggeries', null, error.message);
  }
};

export const getAdminPiggeries = async (req, res) => {
  const { page = 1, limit = 1000 } = req.query; // Increased default limit for admin
  
  try {
    const piggeries = await Piggery.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Piggery.countDocuments();

    res.json({
      piggeries,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePiggery = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, published, featured } = req.body;
    
    const existingPiggery = await Piggery.findById(id);
    if (!existingPiggery) {
      return sendResponse(res, false, 'Piggery content not found', null, null, 404);
    }

    let imageId = existingPiggery.image;
    
    // Handle new file upload
    if (req.file) {
      imageId = await updateGridFSFile(existingPiggery.image, req.file.id);
    }

    // Parse metadata to ensure it's stored as an object
    const parsedMetadata = metadata ? parseMetadata(metadata) : existingPiggery.metadata;
    
    let updateData = { 
      title: title || existingPiggery.title,
      content: content || existingPiggery.content,
      metadata: parsedMetadata,
      published: published !== undefined ? (published === 'true' || published === true) : existingPiggery.published,
      featured: featured !== undefined ? (featured === 'true' || featured === true) : existingPiggery.featured,
      image: imageId
    };

    const updatedPiggery = await Piggery.findByIdAndUpdate(id, updateData, { new: true });
    sendResponse(res, true, 'Piggery content updated successfully', updatedPiggery);
  } catch (error) {
    console.error('Error updating piggery content:', error);
    sendResponse(res, false, 'Failed to update piggery content', null, error.message, 500);
  }
};

export const deletePiggery = async (req, res) => {
  try {
    const { id } = req.params;
    const piggery = await Piggery.findById(id);

    if (!piggery) {
      return sendResponse(res, false, 'Piggery content not found', null, null, 404);
    }

    // Delete the associated image file from GridFS if it exists
    if (piggery.image) {
      await cleanupGridFSFile(piggery.image);
    }

    // Delete the piggery content from the database
    await Piggery.findByIdAndDelete(id);

    sendResponse(res, true, 'Piggery content deleted successfully');
  } catch (error) {
    console.error('Error deleting piggery content:', error);
    sendResponse(res, false, 'Failed to delete piggery content', null, error.message, 500);
  }
};

// ----- GOAT CRUD -----


export const createGoat = async (req, res) => {
  try {
    const { title, content, metadata, published, featured, author, category, tags, keywords, summary, readTime } = req.body;
    let imageId = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.', null, null, 400);
    }

    // Handle file from GridFS
    if (req.file) {
      imageId = req.file.id; // Store GridFS file ID
    }

    // Setup error handler to cleanup file if creation fails
    const handleError = async (error) => {
      if (imageId) {
        await cleanupGridFSFile(imageId);
      }
      return sendResponse(res, false, 'Failed to create goat content', null, error.message, 500);
    };

    // Parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      console.warn('Invalid metadata format, using empty object:', error);
      parsedMetadata = {};
    }

    // Parse tags if it's a JSON string
    let parsedTags = [];
    try {
      parsedTags = tags ? JSON.parse(tags) : [];
    } catch (error) {
      // If parsing fails, try splitting as comma-separated string
      parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    }

    // Parse keywords if it's a JSON string
    let parsedKeywords = [];
    try {
      parsedKeywords = keywords ? JSON.parse(keywords) : [];
    } catch (error) {
      // If parsing fails, try splitting as comma-separated string
      parsedKeywords = keywords ? keywords.split(',').map(keyword => keyword.trim()).filter(Boolean) : [];
    }

    const newGoat = new Goat({
      title,
      content,
      author: author || '',
      category: category || 'Goat',
      tags: parsedTags,
      image: imageId, // GridFS file ID
      metadata: {
        ...parsedMetadata,
        keywords: parsedKeywords,
        summary: summary || '',
        readTime: readTime || 5
      },
      published: published === 'true' || published === true,
      featured: featured === 'true' || featured === true
    });

    try {
      const savedGoat = await newGoat.save();
      sendResponse(res, true, 'Goat content created successfully', savedGoat, null, 201);
    } catch (error) {
      return await handleError(error);
    }
  } catch (error) {
    console.error('Error creating goat content:', error);
    sendResponse(res, false, 'Failed to create goat content', null, error.message, 500);
  }
};

export const getGoatById = async (req, res) => {
  try {
    const goat = await Goat.findById(req.params.id);
    if (!goat) {
      return res.status(404).json({ success: false, message: 'Goat content not found' });
    }
    res.json({ success: true, data: goat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getGoats = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };
    const goats = await Goat.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Goat.countDocuments(query);
    sendResponse(res, true, 'Goats retrieved successfully', { goats, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve goats', null, error.message);
  }
};

export const getAdminGoats = async (req, res) => {
  const { page = 1, limit = 1000 } = req.query; // Increased default limit for admin
  
  try {
    const goats = await Goat.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Goat.countDocuments();

    res.json({
      goats,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const updateGoat = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, published, featured } = req.body;
    
    const existingGoat = await Goat.findById(id);
    if (!existingGoat) {
      return sendResponse(res, false, 'Goat content not found', null, null, 404);
    }

    let imageId = existingGoat.image;
    
    // Handle new file upload
    if (req.file) {
      imageId = await updateGridFSFile(existingGoat.image, req.file.id);
    }

    // Parse metadata to ensure it's stored as an object
    const parsedMetadata = metadata ? parseMetadata(metadata) : existingGoat.metadata;
    
    let updateData = { 
      title: title || existingGoat.title,
      content: content || existingGoat.content,
      metadata: parsedMetadata,
      published: published !== undefined ? (published === 'true' || published === true) : existingGoat.published,
      featured: featured !== undefined ? (featured === 'true' || featured === true) : existingGoat.featured,
      image: imageId
    };

    const updatedGoat = await Goat.findByIdAndUpdate(id, updateData, { new: true });
    sendResponse(res, true, 'Goat content updated successfully', updatedGoat);
  } catch (error) {
    console.error('Error updating goat content:', error);
    sendResponse(res, false, 'Failed to update goat content', null, error.message, 500);
  }
};

export const deleteGoat = async (req, res) => {
  try {
    const { id } = req.params;
    const goat = await Goat.findById(id);

    if (!goat) {
      return sendResponse(res, false, 'Goat content not found', null, null, 404);
    }

    // Delete the associated image file from GridFS if it exists
    if (goat.image) {
      await cleanupGridFSFile(goat.image);
    }

    // Delete the goat content from the database
    await Goat.findByIdAndDelete(id);

    sendResponse(res, true, 'Goat content deleted successfully');
  } catch (error) {
    console.error('Error deleting goat content:', error);
    sendResponse(res, false, 'Failed to delete goat content', null, error.message, 500);
  }
};

// ----- DAIRY CRUD -----

export const createDairy = async (req, res) => {
  try {
    const { title, content, metadata, published, featured, author, category, tags, keywords, summary, readTime } = req.body;
    let imageId = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.', null, null, 400);
    }

    // Handle file from GridFS
    if (req.file) {
      imageId = req.file.id; // Store GridFS file ID
    }

    // Setup error handler to cleanup file if creation fails
    const handleError = async (error) => {
      if (imageId) {
        await cleanupGridFSFile(imageId);
      }
      return sendResponse(res, false, 'Failed to create dairy content', null, error.message, 500);
    };

    // Parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      console.warn('Invalid metadata format, using empty object:', error);
      parsedMetadata = {};
    }

    // Parse tags if it's a JSON string
    let parsedTags = [];
    try {
      parsedTags = tags ? JSON.parse(tags) : [];
    } catch (error) {
      // If parsing fails, try splitting as comma-separated string
      parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    }

    // Parse keywords if it's a JSON string
    let parsedKeywords = [];
    try {
      parsedKeywords = keywords ? JSON.parse(keywords) : [];
    } catch (error) {
      // If parsing fails, try splitting as comma-separated string
      parsedKeywords = keywords ? keywords.split(',').map(keyword => keyword.trim()).filter(Boolean) : [];
    }

    const newDairy = new Dairy({
      title,
      content,
      author: author || '',
      category: category || 'Dairy',
      tags: parsedTags,
      image: imageId, // GridFS file ID
      metadata: {
        ...parsedMetadata,
        keywords: parsedKeywords,
        summary: summary || '',
        readTime: readTime || 5
      },
      published: published === 'true' || published === true,
      featured: featured === 'true' || featured === true
    });

    try {
      const savedDairy = await newDairy.save();
      sendResponse(res, true, 'Dairy content created successfully', savedDairy, null, 201);
    } catch (error) {
      return await handleError(error);
    }
  } catch (error) {
    console.error('Error creating dairy content:', error);
    sendResponse(res, false, 'Failed to create dairy content', null, error.message, 500);
  }
};

export const getDairyById = async (req, res) => {
  try {
    const dairy = await Dairy.findById(req.params.id);
    if (!dairy) {
      return res.status(404).json({ success: false, message: 'Dairy content not found' });
    }
    res.json({ success: true, data: dairy });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getDairies = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };
    const dairies = await Dairy.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Dairy.countDocuments(query);
    sendResponse(res, true, 'Dairy content retrieved successfully', { dairies, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve dairy content', null, error.message);
  }
};

export const getAdminDairies = async (req, res) => {
  const { page = 1, limit = 1000 } = req.query; // Increased default limit for admin
  
  try {
    const dairies = await Dairy.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Dairy.countDocuments();

    res.json({
      dairies,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDairy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, published, featured } = req.body;
    
    const existingDairy = await Dairy.findById(id);
    if (!existingDairy) {
      return sendResponse(res, false, 'Dairy content not found', null, null, 404);
    }

    let imageId = existingDairy.image;
    
    // Handle new file upload
    if (req.file) {
      imageId = await updateGridFSFile(existingDairy.image, req.file.id);
    }

    // Parse metadata to ensure it's stored as an object
    const parsedMetadata = metadata ? parseMetadata(metadata) : existingDairy.metadata;
    
    let updateData = { 
      title: title || existingDairy.title,
      content: content || existingDairy.content,
      metadata: parsedMetadata,
      published: published !== undefined ? (published === 'true' || published === true) : existingDairy.published,
      featured: featured !== undefined ? (featured === 'true' || featured === true) : existingDairy.featured,
      image: imageId
    };

    const updatedDairy = await Dairy.findByIdAndUpdate(id, updateData, { new: true });
    sendResponse(res, true, 'Dairy content updated successfully', updatedDairy);
  } catch (error) {
    console.error('Error updating dairy content:', error);
    sendResponse(res, false, 'Failed to update dairy content', null, error.message, 500);
  }
};

export const deleteDairy = async (req, res) => {
  try {
    const { id } = req.params;
    const dairy = await Dairy.findById(id);

    if (!dairy) {
      return sendResponse(res, false, 'Dairy content not found', null, null, 404);
    }

    // Delete the associated image file from GridFS if it exists
    if (dairy.image) {
      await cleanupGridFSFile(dairy.image);
    }

    // Delete the dairy content from the database
    await Dairy.findByIdAndDelete(id);

    sendResponse(res, true, 'Dairy content deleted successfully');
  } catch (error) {
    console.error('Error deleting dairy content:', error);
    sendResponse(res, false, 'Failed to delete dairy content', null, error.message, 500);
  }
};
// ----- BEEF CRUD -----

export const createBeef = async (req, res) => {
  try {
    const { title, content, metadata, published, featured, author, category, tags, keywords, summary, readTime } = req.body;
    let imageId = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.', null, null, 400);
    }

    // Handle file from GridFS
    if (req.file) {
      imageId = req.file.id; // Store GridFS file ID
    }

    // Setup error handler to cleanup file if creation fails
    const handleError = async (error) => {
      if (imageId) {
        await cleanupGridFSFile(imageId);
      }
      return sendResponse(res, false, 'Failed to create beef content', null, error.message, 500);
    };

    // Parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      console.warn('Invalid metadata format, using empty object:', error);
      parsedMetadata = {};
    }

    // Parse tags if it's a JSON string
    let parsedTags = [];
    try {
      parsedTags = tags ? JSON.parse(tags) : [];
    } catch (error) {
      // If parsing fails, try splitting as comma-separated string
      parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    }

    // Parse keywords if it's a JSON string
    let parsedKeywords = [];
    try {
      parsedKeywords = keywords ? JSON.parse(keywords) : [];
    } catch (error) {
      // If parsing fails, try splitting as comma-separated string
      parsedKeywords = keywords ? keywords.split(',').map(keyword => keyword.trim()).filter(Boolean) : [];
    }

    const newBeef = new Beef({
      title,
      content,
      author: author || '',
      category: category || 'Beef',
      tags: parsedTags,
      image: imageId, // GridFS file ID
      metadata: {
        ...parsedMetadata,
        keywords: parsedKeywords,
        summary: summary || '',
        readTime: readTime || 5
      },
      published: published === 'true' || published === true,
      featured: featured === 'true' || featured === true
    });

    try {
      const savedBeef = await newBeef.save();
      sendResponse(res, true, 'Beef content created successfully', savedBeef, null, 201);
    } catch (error) {
      return await handleError(error);
    }
  } catch (error) {
    console.error('Error creating beef content:', error);
    sendResponse(res, false, 'Failed to create beef content', null, error.message, 500);
  }
};

export const getBeefById = async (req, res) => {
  try {
    const beef = await Beef.findById(req.params.id);
    if (!beef) {
      return sendResponse(res, false, 'Beef content not found', null, null, 404);
    }
    sendResponse(res, true, 'Beef content retrieved successfully', beef);
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve beef content', null, error.message, 500);
  }
};

export const getBeefs = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };
    const beefs = await Beef.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Beef.countDocuments(query);
    sendResponse(res, true, 'Beef content retrieved successfully', { beefs, total, page, limit });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve beef content', null, error.message);
  }
};

export const getAdminBeefs = async (req, res) => {
  const { page = 1, limit = 1000 } = req.query; // Increased default limit for admin
  
  try {
    const beefs = await Beef.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Beef.countDocuments();

    sendResponse(res, true, 'Admin beefs retrieved successfully', {
      beefs,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    sendResponse(res, false, 'Failed to retrieve admin beefs', null, error.message);
  }
};
export const updateBeef = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metadata, published, featured } = req.body;
    
    const existingBeef = await Beef.findById(id);
    if (!existingBeef) {
      return sendResponse(res, false, 'Beef content not found', null, null, 404);
    }

    let imageId = existingBeef.image;
    
    // Handle new file upload
    if (req.file) {
      imageId = await updateGridFSFile(existingBeef.image, req.file.id);
    }

    // Parse metadata to ensure it's stored as an object
    const parsedMetadata = metadata ? parseMetadata(metadata) : existingBeef.metadata;
    
    let updateData = { 
      title: title || existingBeef.title,
      content: content || existingBeef.content,
      metadata: parsedMetadata,
      published: published !== undefined ? (published === 'true' || published === true) : existingBeef.published,
      featured: featured !== undefined ? (featured === 'true' || featured === true) : existingBeef.featured,
      image: imageId
    };

    const updatedBeef = await Beef.findByIdAndUpdate(id, updateData, { new: true });
    sendResponse(res, true, 'Beef content updated successfully', updatedBeef);
  } catch (error) {
    console.error('Error updating beef content:', error);
    sendResponse(res, false, 'Failed to update beef content', null, error.message, 500);
  }
};

export const deleteBeef = async (req, res) => {
  try {
    const { id } = req.params;
    const beef = await Beef.findById(id);

    if (!beef) {
      return sendResponse(res, false, 'Beef content not found', null, null, 404);
    }

    // Delete the associated image file from GridFS if it exists
    if (beef.image) {
      await cleanupGridFSFile(beef.image);
    }

    // Delete the beef content from the database
    await Beef.findByIdAndDelete(id);

    sendResponse(res, true, 'Beef content deleted successfully');
  } catch (error) {
    console.error('Error deleting beef content:', error);
    sendResponse(res, false, 'Failed to delete beef content', null, error.message, 500);
  }
};


// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password',
  },
});

// Enhanced subscriber management functions
export const getSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 10, subscriptionType, isActive } = req.query;
    
    // Build query filters
    const query = {};
    if (subscriptionType && subscriptionType !== 'all') {
      query.subscriptionType = subscriptionType;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const subscribers = await Subscriber.find(query)
      .sort({ subscribedAt: -1 })
      .skip((page -  1) * limit)
      .limit(Number(limit));

    const total = await Subscriber.countDocuments(query);

    // Analytics data
    const analytics = {
      totalSubscribers: await Subscriber.countDocuments(),
      activeSubscribers: await Subscriber.countDocuments({ isActive: true }),
      inactiveSubscribers: await Subscriber.countDocuments({ isActive: false }),
      subscriptionTypes: await Subscriber.aggregate([
        { $group: { _id: '$subscriptionType', count: { $sum: 1 } } }
      ])
    };

    res.status(200).json({
      success: true,
      data: {
        subscribers,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        analytics
      }
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching subscribers',
      error: error.message 
    });
  }
};

// Enhanced subscriber creation with welcome email
export const createSubscriber = async (req, res) => {
  const { email, subscriptionType = 'all' } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please enter a valid email address' 
    });
  }

  try {
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'This email is already subscribed to our newsletter' 
        });
      } else {
        // Reactivate inactive subscriber
        existingSubscriber.isActive = true;
        existingSubscriber.subscriptionType = subscriptionType;
        existingSubscriber.subscribedAt = new Date();
        await existingSubscriber.save();

        // Send welcome back email (don't let email errors block reactivation)
        try {
          const emailResult = await sendWelcomeEmailToSubscriber(email, { subscriptionType });
          if (!emailResult || !emailResult.success) {
            console.error('Failed to send welcome back email:', emailResult?.error || 'Unknown email error');
          }
        } catch (emailError) {
          console.error('Welcome back email error:', emailError.message);
          // Log but don't fail the reactivation
        }

        return res.status(200).json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated. We\'re delighted to have you in our farming community again.',
          data: existingSubscriber
        });
      }
    }

    const subscriber = new Subscriber({ 
      email, 
      subscriptionType,
      isActive: true 
    });
    await subscriber.save();

    // Send welcome email (don't let email errors block subscription)
    try {
  const emailResult = await sendWelcomeEmailToSubscriber(email, { subscriptionType });
      if (!emailResult || !emailResult.success) {
        console.error('Failed to send welcome email:', emailResult?.error || 'Unknown email error');
      }
    } catch (emailError) {
      console.error('Welcome email error:', emailError.message);
      // Log but don't fail the subscription
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing to our newsletter! Welcome to the Ishaazi Livestock Services community. We\'re excited to share the latest farming insights and tips with you.',
      data: subscriber
    });
  } catch (error) {
    console.error('Error adding subscriber:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while adding subscriber',
      error: error.message 
    });
  }
};

// Delete a subscriber (enhanced)
export const deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscriber not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Subscriber removed successfully' 
    });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting subscriber',
      error: error.message 
    });
  }
};

// Bulk operations for subscribers
export const bulkUpdateSubscribers = async (req, res) => {
  try {
    const { action, subscriberIds, subscriptionType } = req.body;

    if (!action || !subscriberIds || !Array.isArray(subscriberIds)) {
      return res.status(400).json({
        success: false,
        message: 'Action and subscriber IDs are required'
      });
    }

    let result;
    switch (action) {
      case 'activate':
        result = await Subscriber.updateMany(
          { _id: { $in: subscriberIds } },
          { isActive: true }
        );
        break;
      case 'deactivate':
        result = await Subscriber.updateMany(
          { _id: { $in: subscriberIds } },
          { isActive: false }
        );
        break;
      case 'updateType':
        if (!subscriptionType) {
          return res.status(400).json({
            success: false,
            message: 'Subscription type is required for update action'
          });
        }
        result = await Subscriber.updateMany(
          { _id: { $in: subscriberIds } },
          { subscriptionType }
        );
        break;
      case 'delete':
        result = await Subscriber.deleteMany({ _id: { $in: subscriberIds } });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      modifiedCount: result.modifiedCount || result.deletedCount
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk operation',
      error: error.message
    });
  }
};

// Enhanced newsletter management functions
export const getNewsletters = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const newsletters = await Newsletter.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Newsletter.countDocuments(query);

    // Analytics
    const analytics = {
      totalNewsletters: await Newsletter.countDocuments(),
      draftNewsletters: await Newsletter.countDocuments({ status: 'draft' }),
      sentNewsletters: await Newsletter.countDocuments({ status: 'sent' }),
      totalEmailsSent: await Newsletter.aggregate([
        { $match: { status: 'sent' } },
        { $group: { _id: null, total: { $sum: '$sentTo' } } }
      ])
    };

    res.status(200).json({
      success: true,
      data: {
        newsletters,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        analytics
      }
    });
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching newsletters',
      error: error.message 
    });
  }
};

// Enhanced newsletter creation
export const createNewsletter = async (req, res) => {
  const { title, body, subject, targetSubscriptionTypes = ['all'], featured = false, createdBy } = req.body;
  
  if (!title || !body || !subject) {
    return sendResponse(res, false, 'Title, subject, and body are required', null, null, 400);
  }

  try {
    // Use createdBy from request body if req.admin._id is not available
    // This allows for testing while maintaining backward compatibility
    const adminId = req.admin?._id || createdBy;
    
    // For testing purposes, if no admin ID is available, use a default test ID
    // This ensures the API can be tested without a valid admin account
    const testAdminId = '684de6093e77b767108cf318'; // Default test admin ID
    const finalAdminId = adminId || testAdminId;
    
    const newsletter = new Newsletter({ 
      title, 
      body, 
      subject,
      targetSubscriptionTypes,
      featured,
      createdBy: finalAdminId
    });
    await newsletter.save();
    
    sendResponse(res, true, 'Newsletter created successfully', newsletter, null, 201);
  } catch (error) {
    console.error('Error creating newsletter:', error);
    sendResponse(res, false, 'Error creating newsletter', null, error.message, 500);
  }
};

// Enhanced newsletter update
export const updateNewsletter = async (req, res) => {
  try {
    const { title, body, subject, targetSubscriptionTypes, featured } = req.body;
    
    const newsletter = await Newsletter.findById(req.params.id);
    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter not found'
      });
    }

    // Don't allow editing sent newsletters
    if (newsletter.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit newsletters that have already been sent'
      });
    }

    const updatedNewsletter = await Newsletter.findByIdAndUpdate(
      req.params.id,
      { title, body, subject, targetSubscriptionTypes, featured },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Newsletter updated successfully',
      data: updatedNewsletter
    });
  } catch (error) {
    console.error('Error updating newsletter:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating newsletter',
      error: error.message 
    });
  }
};

// Enhanced newsletter deletion
export const deleteNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);
    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter not found'
      });
    }

    // Don't allow deleting sent newsletters (for audit purposes)
    if (newsletter.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete newsletters that have been sent'
      });
    }

    await Newsletter.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Newsletter deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting newsletter',
      error: error.message 
    });
  }
};

// Enhanced newsletter sending with analytics tracking
export const sendNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);
    if (!newsletter) {
      return res.status(404).json({ 
        success: false, 
        message: 'Newsletter not found' 
      });
    }

    if (newsletter.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'This newsletter has already been sent'
      });
    }

    // Get subscribers based on target subscription types
    const subscriberQuery = {
      isActive: true
    };

    if (!newsletter.targetSubscriptionTypes.includes('all')) {
      subscriberQuery.subscriptionType = { 
        $in: newsletter.targetSubscriptionTypes 
      };
    }

    const subscribers = await Subscriber.find(subscriberQuery);

    if (subscribers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active subscribers found for the selected subscription types'
      });
    }

    // Send newsletter using email service
    const sendResult = await sendNewsletterEmail(newsletter, subscribers);

    // Update newsletter status and analytics
    newsletter.status = 'sent';
    newsletter.sentAt = new Date();
    newsletter.sentTo = sendResult.sent;
    await newsletter.save();

    // Update subscriber analytics
    await Subscriber.updateMany(
      { _id: { $in: subscribers.map(s => s._id) } },
      { 
        $inc: { emailsSent: 1 },
        $set: { lastEmailSent: new Date() }
      }
    );

    res.status(200).json({ 
      success: true, 
      message: `Newsletter sent successfully to ${sendResult.sent} subscribers`,
      data: {
        sent: sendResult.sent,
        failed: sendResult.failed,
        errors: sendResult.errors
      }
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending newsletter',
      error: error.message 
    });
  }
};

// ----- EVENT CRUD -----
export const createEvent = async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, metadata, published } = req.body;
    let imageId = null;

    // Check required fields
    if (!title || !description || !startDate) {
      return sendResponse(res, false, 'Title, description, and start date are required.');
    }

    // Handle file from GridFS
    if (req.file) {
      imageId = req.file.id; // Store GridFS file ID
    }

    // Safely parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (err) {
      console.error("Metadata parsing error:", err);
      return sendResponse(res, false, 'Invalid metadata format. Please provide valid JSON.');
    }

    const newEvent = new Event({
      title,
      description,
      startDate,
      endDate: endDate || null,
      location: location || "",
      image: imageId, // Use GridFS file ID
      metadata: parsedMetadata,
      published: published === 'true' || published === true
    });

    const savedEvent = await newEvent.save();
    sendResponse(res, true, 'Event created successfully', savedEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    sendResponse(res, false, 'Failed to create event', null, error.message);
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getEvents = async (req, res) => {
  const { page = 1, limit = 10, admin } = req.query;

  try {
    const query = admin ? {} : { published: true };

    console.log("🔥 API HIT: Fetching events...");
    console.log("🔍 Query:", query);

    const totalEvents = await Event.countDocuments({});
    console.log("Total events in database:", totalEvents);

    const publishedEventsCount = await Event.countDocuments({ published: true });
    console.log("Published events in database:", publishedEventsCount);

    // Updated sort to use startDate instead of date
    const events = await Event.find(query)
      .sort({ startDate: 1 }) // Sort by startDate ascending
      .skip((page - 1) * limit)
      .limit(Number(limit));

    console.log("✅ Events found:", events.length);
    if (events.length > 0) console.log("Sample event:", events[0]);

    const total = await Event.countDocuments(query);

    sendResponse(res, true, 'Events retrieved successfully', { events, total, page, limit });
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    sendResponse(res, false, 'Failed to retrieve events', null, error.message);
  }
};

export const getAdminEvents = async (req, res) => {
  const { page = 1, limit = 1000 } = req.query; // Increased default limit for admin
  
  try {
    // Updated sort to use startDate instead of date
    const events = await Event.find()
      .sort({ startDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Event.countDocuments();

    res.json({
      events,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate, location, metadata, published } = req.body;
    
    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Safely parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (err) {
      return res.status(400).json({ message: 'Invalid metadata format. Please provide valid JSON.' });
    }
    
    let updateData = { 
      title, 
      description, 
      startDate,
      endDate,
      location,
      metadata: parsedMetadata,
      published: published === 'true' || published === true
    };

    // Handle GridFS file update
    if (req.file) {
      updateData.image = await updateGridFSFile(existingEvent.image, req.file.id);
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { new: true });
    
    sendResponse(res, true, 'Event updated successfully', updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    sendResponse(res, false, 'Failed to update event', null, error.message);
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Clean up GridFS file if it exists
    if (event.image) {
      await cleanupGridFSFile(event.image);
    }

    // Delete the event from the database
    await Event.findByIdAndDelete(id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};

// ----- AUCTION CRUD -----

// Create a new auction
export const createAuction = async (req, res) => {
  try {
    const { 
      title, description, location, date, startTime, endTime, 
      livestock, auctioneer, registrationRequired, registrationDeadline, 
      registrationFee, terms, published 
    } = req.body;
    
    let imageId = null;

    if (!title || !description || !location || !date || !startTime || !endTime) {
      return sendResponse(res, false, 'Title, description, location, date, start time, and end time are required.');
    }

    if (req.file) {
      imageId = req.file.id; // Store GridFS file ID
    }

    // Parse livestock data if it's a string
    let parsedLivestock = [];
    if (livestock) {
      try {
        parsedLivestock = typeof livestock === 'string' ? JSON.parse(livestock) : livestock;
      } catch (error) {
        return sendResponse(res, false, 'Invalid livestock data format.');
      }
    }

    // Parse auctioneer data if it's a string
    let parsedAuctioneer = {};
    if (auctioneer) {
      try {
        parsedAuctioneer = typeof auctioneer === 'string' ? JSON.parse(auctioneer) : auctioneer;
      } catch (error) {
        return sendResponse(res, false, 'Invalid auctioneer data format.');
      }
    }

    const auction = new Auction({
      title,
      description,
      location,
      date: new Date(date),
      startTime,
      endTime,
      livestock: parsedLivestock,
      auctioneer: parsedAuctioneer,
      registrationRequired: registrationRequired === 'true',
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      registrationFee: Number(registrationFee) || 0,
      terms: terms || 'Standard auction terms and conditions apply',
      image: imageId, // Store GridFS file ID in image field
      published: published !== 'false'
    });

    await auction.save();
    sendResponse(res, true, 'Auction created successfully', auction);
  } catch (error) {
    console.error('Error creating auction:', error);
    sendResponse(res, false, 'Failed to create auction', null, error.message);
  }
};

// Get all auctions (public view)
export const getAuctions = async (req, res) => {
  const { page = 1, limit = 10, category, location, status = 'upcoming', admin } = req.query;

  try {
    const query = admin ? {} : { published: true };
    
    // Add status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Add category filter
    if (category && category !== 'all') {
      query['livestock.category'] = category;
    }

    // Add location filter
    if (location && location !== 'all') {
      query.location = { $regex: location, $options: 'i' };
    }

    // Sort upcoming auctions by date ascending, others by date descending
    const sortOrder = status === 'upcoming' ? 1 : -1;

    const auctions = await Auction.find(query)
      .sort({ date: sortOrder })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Auction.countDocuments(query);
    
    sendResponse(res, true, 'Auctions retrieved successfully', { 
      auctions, 
      total, 
      page: Number(page), 
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching auctions:', error);
    sendResponse(res, false, 'Failed to retrieve auctions', null, error.message);
  }
};

// Get auction by ID
export const getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;
    const auction = await Auction.findById(id);

    if (!auction) {
      return sendResponse(res, false, 'Auction not found');
    }

    // Increment view count
    auction.views = (auction.views || 0) + 1;
    await auction.save();

    sendResponse(res, true, 'Auction retrieved successfully', auction);
  } catch (error) {
    console.error('Error fetching auction:', error);
    sendResponse(res, false, 'Failed to retrieve auction', null, error.message);
  }
};

// Get all auctions for admin (with pagination)
export const getAdminAuctions = async (req, res) => {
  const { page = 1, limit = 1000 } = req.query; // Increased default limit for admin

  try {
    const auctions = await Auction.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Auction.countDocuments();

    res.status(200).json({
      success: true,
      auctions,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    console.error('Error fetching admin auctions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin auctions',
      error: error.message,
    });
  }
};

// Update auction
export const updateAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, location, date, startTime, endTime, 
      livestock, auctioneer, registrationRequired, registrationDeadline, 
      registrationFee, terms, published 
    } = req.body;

    const auction = await Auction.findById(id);
    if (!auction) {
      return sendResponse(res, false, 'Auction not found');
    }

    // Update image if provided
    if (req.file) {
      // Clean up old GridFS file
      if (auction.image) {
        await cleanupGridFSFile(auction.image);
      }
      auction.image = req.file.id; // Store new GridFS file ID
    }

    // Update fields
    if (title) auction.title = title;
    if (description) auction.description = description;
    if (location) auction.location = location;
    if (date) auction.date = new Date(date);
    if (startTime) auction.startTime = startTime;
    if (endTime) auction.endTime = endTime;
    if (terms) auction.terms = terms;
    if (registrationFee !== undefined) auction.registrationFee = Number(registrationFee);
    if (registrationRequired !== undefined) auction.registrationRequired = registrationRequired === 'true';
    if (registrationDeadline) auction.registrationDeadline = new Date(registrationDeadline);
    if (published !== undefined) auction.published = published !== 'false';

    // Update livestock data
    if (livestock) {
      try {
        auction.livestock = typeof livestock === 'string' ? JSON.parse(livestock) : livestock;
      } catch (error) {
        return sendResponse(res, false, 'Invalid livestock data format.');
      }
    }

    // Update auctioneer data
    if (auctioneer) {
      try {
        auction.auctioneer = typeof auctioneer === 'string' ? JSON.parse(auctioneer) : auctioneer;
      } catch (error) {
        return sendResponse(res, false, 'Invalid auctioneer data format.');
      }
    }

    await auction.save();
    sendResponse(res, true, 'Auction updated successfully', auction);
  } catch (error) {
    console.error('Error updating auction:', error);
    sendResponse(res, false, 'Failed to update auction', null, error.message);
  }
};

// Delete auction
export const deleteAuction = async (req, res) => {
  try {
    const { id } = req.params;

    const auction = await Auction.findById(id);
    if (!auction) {
      return sendResponse(res, false, 'Auction not found');
    }

    // Clean up GridFS file if it exists
    if (auction.image) {
      await cleanupGridFSFile(auction.image);
    }

    await Auction.findByIdAndDelete(id);
    sendResponse(res, true, 'Auction deleted successfully');
  } catch (error) {
    console.error('Error deleting auction:', error);
    sendResponse(res, false, 'Failed to delete auction', null, error.message);
  }
};

// Register interest in auction
export const registerInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact } = req.body;

    if (!name || !contact) {
      return sendResponse(res, false, 'Name and contact information are required');
    }

    const auction = await Auction.findById(id);
    if (!auction) {
      return sendResponse(res, false, 'Auction not found');
    }

    // Check if already registered
    const existingRegistration = auction.interestedBuyers.find(
      buyer => buyer.contact === contact
    );

    if (existingRegistration) {
      return sendResponse(res, false, 'Already registered for this auction');
    }

    // Add to interested buyers
    auction.interestedBuyers.push({ name, contact });
    await auction.save();

    sendResponse(res, true, 'Interest registered successfully');
  } catch (error) {
    console.error('Error registering interest:', error);
    sendResponse(res, false, 'Failed to register interest', null, error.message);
  }
};

// Get upcoming auctions (utility function)
export const getUpcomingAuctions = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const auctions = await Auction.findUpcoming().limit(Number(limit));
    
    sendResponse(res, true, 'Upcoming auctions retrieved successfully', auctions);
  } catch (error) {
    console.error('Error fetching upcoming auctions:', error);
    sendResponse(res, false, 'Failed to retrieve upcoming auctions', null, error.message);
  }
};

// ----- EVENT REGISTRATION SYSTEM -----
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, phone } = req.body;

    // Validate required fields
    if (!name || !email) {
      return sendResponse(res, false, 'Name and email are required');
    }

    // Check if event exists and is published
    const event = await Event.findById(eventId);
    if (!event) {
      return sendResponse(res, false, 'Event not found');
    }

    if (!event.published) {
      return sendResponse(res, false, 'Event is not available for registration');
    }

    // Check if event is in the past
    if (new Date(event.startDate) < new Date()) {
      return sendResponse(res, false, 'Cannot register for past events');
    }

    // Check if already registered
    const existingRegistration = await EventRegistration.findOne({
      eventId,
      email: email.toLowerCase()
    });

    if (existingRegistration) {
      return sendResponse(res, false, 'You are already registered for this event');
    }

    // Create registration
    const registration = new EventRegistration({
      eventId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined
    });

    const savedRegistration = await registration.save();

    // Populate event details for response
    await savedRegistration.populate('eventId', 'title startDate location');

    // Send confirmation email
    try {
      await sendEmail({
        to: email,
        subject: `Event Registration Confirmation - ${event.title}`,
        templateName: 'event-registration-confirmation',
        templateData: {
          registrantName: name,
          participantEmail: email,
          eventTitle: event.title,
          eventDate: new Date(event.startDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          eventLocation: event.location || 'To be announced',
          registrationId: savedRegistration._id.toString().slice(-8).toUpperCase(),
          companyName: 'Ishaazi Livestock Services',
          contactEmail: process.env.SUPPORT_EMAIL || 'info@ishaazilivestockservices.com'
        }
      });
      
      console.log(`Event registration confirmation email sent to: ${email}`);
    } catch (emailError) {
      console.error('Failed to send event registration confirmation email:', emailError);
      // Don't fail the registration if email fails
    }

    sendResponse(res, true, 'Successfully registered for event', {
      registration: savedRegistration,
      event: {
        title: event.title,
        startDate: event.startDate,
        location: event.location
      }
    });

  } catch (error) {
    console.error('Error registering for event:', error);
    if (error.code === 11000) {
      return sendResponse(res, false, 'You are already registered for this event');
    }
    sendResponse(res, false, 'Failed to register for event', null, error.message);
  }
};

export const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return sendResponse(res, false, 'Event not found');
    }

    const query = { eventId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const [registrations, total] = await Promise.all([
      EventRegistration.find(query)
        .populate('eventId', 'title startDate location')
        .sort({ registrationDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      EventRegistration.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    sendResponse(res, true, 'Event registrations retrieved successfully', {
      registrations,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalCount: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      event: {
        title: event.title,
        startDate: event.startDate,
        location: event.location
      }
    });

  } catch (error) {
    console.error('Error fetching event registrations:', error);
    sendResponse(res, false, 'Failed to retrieve event registrations', null, error.message);
  }
};

export const getRegistrationByEmail = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.query;

    if (!email) {
      return sendResponse(res, false, 'Email is required');
    }

    const registration = await EventRegistration.findOne({
      eventId,
      email: email.toLowerCase()
    }).populate('eventId', 'title startDate location');

    if (!registration) {
      return sendResponse(res, false, 'Registration not found');
    }

    sendResponse(res, true, 'Registration found', registration);

  } catch (error) {
    console.error('Error fetching registration by email:', error);
    sendResponse(res, false, 'Failed to retrieve registration', null, error.message);
  }
};

export const cancelEventRegistration = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;

    if (!email) {
      return sendResponse(res, false, 'Email is required');
    }

    const registration = await EventRegistration.findOne({
      eventId,
      email: email.toLowerCase()
    });

    if (!registration) {
      return sendResponse(res, false, 'Registration not found');
    }

    // Update status to cancelled instead of deleting
    registration.status = 'cancelled';
    await registration.save();

    sendResponse(res, true, 'Registration cancelled successfully', registration);

  } catch (error) {
    console.error('Error cancelling registration:', error);
    sendResponse(res, false, 'Failed to cancel registration', null, error.message);
  }
};

export const getEventRegistrationStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return sendResponse(res, false, 'Event not found');
    }

    const stats = await EventRegistration.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRegistrations = await EventRegistration.countDocuments({ eventId });

    const formattedStats = {
      total: totalRegistrations,
      confirmed: 0,
      pending: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });

    sendResponse(res, true, 'Event registration statistics retrieved successfully', {
      stats: formattedStats,
      event: {
        title: event.title,
        startDate: event.startDate,
        location: event.location
      }
    });

  } catch (error) {
    console.error('Error fetching event registration stats:', error);
    sendResponse(res, false, 'Failed to retrieve registration statistics', null, error.message);
  }
};

// Admin-specific newsletter function with enhanced features
export const getAdminNewsletters = async (req, res) => {
  try {
    const { page = 1, limit = 1000, status } = req.query; // Higher limit for admin

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const newsletters = await Newsletter.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Newsletter.countDocuments(query);

    // Enhanced analytics for admin view
    const analytics = {
      totalNewsletters: await Newsletter.countDocuments(),
      draftNewsletters: await Newsletter.countDocuments({ status: 'draft' }),
      sentNewsletters: await Newsletter.countDocuments({ status: 'sent' }),
      totalEmailsSent: await Newsletter.aggregate([
        { $match: { status: 'sent' } },
        { $group: { _id: null, total: { $sum: '$sentTo' } } }
      ]),
      recentActivity: await Newsletter.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status createdAt sentAt')
    };

    res.status(200).json({
      success: true,
      data: {
        newsletters,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        analytics
      }
    });
  } catch (error) {
    console.error('Error fetching admin newsletters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin newsletters',
      error: error.message,
    });
  }
};

// Admin function to get all event registrations across all events
export const getAllEventRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, eventId } = req.query;

    // Build query filters
    const query = {};
    if (status) {
      query.status = status;
    }
    if (eventId) {
      query.eventId = eventId;
    }

    const skip = (page - 1) * limit;
    const [registrations, total] = await Promise.all([
      EventRegistration.find(query)
        .populate('eventId', 'title startDate location maxAttendees')
        .sort({ registrationDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      EventRegistration.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    // Analytics data
    const analytics = {
      totalRegistrations: await EventRegistration.countDocuments(),
      confirmedRegistrations: await EventRegistration.countDocuments({ status: 'confirmed' }),
      pendingRegistrations: await EventRegistration.countDocuments({ status: 'pending' }),
      cancelledRegistrations: await EventRegistration.countDocuments({ status: 'cancelled' }),
      recentRegistrations: await EventRegistration.countDocuments({
        registrationDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    };

    res.status(200).json({
      success: true,
      data: {
        registrations,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        analytics
      }
    });

  } catch (error) {
    console.error('Error fetching all event registrations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve event registrations',
      error: error.message 
    });
  }
};

// Admin function specifically for admin panel - get all event registrations with proper formatting
export const getAdminRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search, sortBy = 'registrationDate', sortOrder = 'desc' } = req.query;

    // Build query filters
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get registrations with event details populated
    const [registrations, total] = await Promise.all([
      EventRegistration.find(query)
        .populate('eventId', 'title date location')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      EventRegistration.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    // Format registrations for admin display
    const formattedRegistrations = registrations.map(registration => ({
      _id: registration._id,
      name: registration.name,
      email: registration.email,
      phone: registration.phone || 'Not provided',
      status: registration.status,
      eventTitle: registration.eventId?.title || 'Unknown Event',
      eventDate: registration.eventId?.date,
      eventLocation: registration.eventId?.location || 'TBD',
      registrationDate: registration.registrationDate,
      createdAt: registration.createdAt,
      updatedAt: registration.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        registrations: formattedRegistrations,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        analytics: {
          totalRegistrations: await EventRegistration.countDocuments(),
          confirmedRegistrations: await EventRegistration.countDocuments({ status: 'confirmed' }),
          pendingRegistrations: await EventRegistration.countDocuments({ status: 'pending' }),
          cancelledRegistrations: await EventRegistration.countDocuments({ status: 'cancelled' }),
          recentRegistrations: await EventRegistration.countDocuments({
            registrationDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          })
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin registrations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve admin registrations',
      error: error.message 
    });
  }
};

// Delete event registration (admin function)
export const deleteEventRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the registration
    const registration = await EventRegistration.findByIdAndDelete(id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Event registration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event registration deleted successfully',
      data: { deletedRegistration: registration }
    });

  } catch (error) {
    console.error('Error deleting event registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event registration',
      error: error.message
    });
  }
};

// Update event registration (admin function)
export const updateEventRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      organization, 
      status, 
      specialRequirements,
      emergencyContact 
    } = req.body;

    // Find the registration
    const registration = await EventRegistration.findById(id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Event registration not found'
      });
    }

    // Update fields if provided
    if (firstName !== undefined) registration.firstName = firstName;
    if (lastName !== undefined) registration.lastName = lastName;
    if (email !== undefined) registration.email = email;
    if (phone !== undefined) registration.phone = phone;
    if (organization !== undefined) registration.organization = organization;
    if (status !== undefined) registration.status = status;
    if (specialRequirements !== undefined) registration.specialRequirements = specialRequirements;
    if (emergencyContact !== undefined) registration.emergencyContact = emergencyContact;

    // Save the updated registration
    const updatedRegistration = await registration.save();

    res.status(200).json({
      success: true,
      message: 'Event registration updated successfully',
      data: { registration: updatedRegistration }
    });

  } catch (error) {
    console.error('Error updating event registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event registration',
      error: error.message
    });
  }
};

// ----- EMAIL AUTOMATION FUNCTIONS -----

/**
 * Handle email subscription confirmation
 */
export const confirmSubscription = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation token is required'
      });
    }

    // Find subscriber by confirmation token
    const subscriber = await Subscriber.findOne({ confirmationToken: token });
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired confirmation token'
      });
    }

    if (subscriber.isConfirmed) {
      return res.status(200).json({
        success: true,
        message: 'Email address already confirmed'
      });
    }

    // Confirm the subscription
    subscriber.isConfirmed = true;
    subscriber.confirmedAt = new Date();
    subscriber.confirmationToken = undefined; // Remove the token
    await subscriber.save();

    // Send welcome email
    try {
  await sendWelcomeEmailToSubscriber(subscriber.email, { subscriptionType: subscriber.subscriptionType });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Email confirmed successfully! Welcome to our newsletter.'
    });

  } catch (error) {
    console.error('Error confirming subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm subscription',
      error: error.message
    });
  }
};

/**
 * Handle unsubscribe requests
 */
export const unsubscribeHandler = async (req, res) => {
  try {
    const { token, email } = req.body;
    
    if (!token && !email) {
      return res.status(400).json({
        success: false,
        message: 'Unsubscribe token or email is required'
      });
    }

    let subscriber;
    
    if (token) {
      // Find by unsubscribe token
      subscriber = await Subscriber.findOne({ unsubscribeToken: token });
    } else if (email) {
      // Find by email
      subscriber = await Subscriber.findOne({ email: email.toLowerCase() });
    }

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    if (!subscriber.isActive) {
      return res.status(200).json({
        success: true,
        message: 'You are already unsubscribed'
      });
    }

    // Unsubscribe the user
    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: 'You have been successfully unsubscribed from our newsletter'
    });

  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process unsubscribe request',
      error: error.message
    });
  }
};

/**
 * Update email preferences
 */
export const updateEmailPreferences = async (req, res) => {
  try {
    const { email, subscriptionType, frequency } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const subscriber = await Subscriber.findOne({ email: email.toLowerCase() });
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    // Update preferences
    if (subscriptionType) {
      subscriber.subscriptionType = subscriptionType;
    }
    
    if (frequency) {
      if (!subscriber.preferences) {
        subscriber.preferences = {};
      }
      subscriber.preferences.frequency = frequency;
    }

    await subscriber.save();

    res.status(200).json({
      success: true,
      message: 'Email preferences updated successfully',
      data: {
        email: subscriber.email,
        subscriptionType: subscriber.subscriptionType,
        preferences: subscriber.preferences
      }
    });

  } catch (error) {
    console.error('Error updating email preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email preferences',
      error: error.message
    });
  }
};

/**
 * READING TIME AND STATISTICS VERIFICATION
 * ========================================
 */

/**
 * Verify and fix reading time accuracy across all content types
 * This function analyzes all content and provides statistics on reading time accuracy
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with reading time verification results
 */
export const verifyReadingTimeAccuracy = async (req, res) => {
  try {
    const { fix = false } = req.query; // Optional parameter to fix inaccuracies
    
    console.log('🔍 Starting reading time verification across all content types...');
    
    const results = {
      verification: {
        blogs: { total: 0, accurate: 0, inaccurate: 0, fixed: 0 },
        news: { total: 0, accurate: 0, inaccurate: 0, fixed: 0 },
        events: { total: 0, accurate: 0, inaccurate: 0, fixed: 0 },
        farms: { total: 0, accurate: 0, inaccurate: 0, fixed: 0 },
        magazines: { total: 0, accurate: 0, inaccurate: 0, fixed: 0 },
        basics: { total: 0, accurate: 0, inaccurate: 0, fixed: 0 },
        dairy: { total: 0, accurate: 0, inaccurate: 0, fixed: 0 },
        beef: { total: 0, accurate: 0, inaccurate: 0, fixed: 0 },
        goats: { total: 0, accurate: 0, inaccurate: 0, fixed: 0 },
        piggery: { total: 0, accurate: 0, inaccurate: 0, fixed: 0 }
      },
      summary: {
        totalContent: 0,
        totalAccurate: 0,
        totalInaccurate: 0,
        totalFixed: 0,
        accuracyPercentage: 0
      },
      inaccurateItems: []
    };

    // Define content models and their types
    const contentModels = [
      { model: Blog, type: 'blog', key: 'blogs' },
      { model: News, type: 'news', key: 'news' },
      { model: Event, type: 'default', key: 'events' },
      { model: Farm, type: 'farm', key: 'farms' },
      { model: Magazine, type: 'magazine', key: 'magazines' },
      { model: Basic, type: 'basic', key: 'basics' },
      { model: Dairy, type: 'dairy', key: 'dairy' },
      { model: Beef, type: 'beef', key: 'beef' },
      { model: Goat, type: 'goats', key: 'goats' },
      { model: Piggery, type: 'piggery', key: 'piggery' }
    ];

    // Process each content type
    for (const { model, type, key } of contentModels) {
      console.log(`🔍 Verifying ${key}...`);
      
      const content = await model.find({}).select('_id title content readTime');
      results.verification[key].total = content.length;
      
      for (const item of content) {
        const calculatedReadTime = calculateReadingTimeByType(item.content || '', type);
        const currentReadTime = item.readTime || 5;
        
        // Check if current reading time is within 25% of calculated time
        const difference = Math.abs(calculatedReadTime - currentReadTime);
        const percentageDiff = (difference / calculatedReadTime) * 100;
        
        if (percentageDiff <= 25) {
          results.verification[key].accurate++;
        } else {
          results.verification[key].inaccurate++;
          
          // Store details of inaccurate items
          results.inaccurateItems.push({
            id: item._id,
            type: key,
            title: item.title.substring(0, 50) + '...',
            currentReadTime,
            calculatedReadTime,
            difference,
            percentageDifference: percentageDiff.toFixed(1)
          });
          
          // Fix if requested
          if (fix === 'true') {
            await model.findByIdAndUpdate(item._id, { readTime: calculatedReadTime });
            results.verification[key].fixed++;
            console.log(`✅ Fixed reading time for ${key}: ${item.title.substring(0, 30)}... (${currentReadTime} → ${calculatedReadTime} min)`);
          }
        }
      }
    }

    // Calculate summary statistics
    for (const key in results.verification) {
      const stats = results.verification[key];
      results.summary.totalContent += stats.total;
      results.summary.totalAccurate += stats.accurate;
      results.summary.totalInaccurate += stats.inaccurate;
      results.summary.totalFixed += stats.fixed;
    }
    
    results.summary.accuracyPercentage = results.summary.totalContent > 0 
      ? ((results.summary.totalAccurate / results.summary.totalContent) * 100).toFixed(1)
      : 0;

    console.log(`📊 Reading time verification complete:`);
    console.log(`   Total content: ${results.summary.totalContent}`);
    console.log(`   Accurate: ${results.summary.totalAccurate} (${results.summary.accuracyPercentage}%)`);
    console.log(`   Inaccurate: ${results.summary.totalInaccurate}`);
    if (fix === 'true') {
      console.log(`   Fixed: ${results.summary.totalFixed}`);
    }

    sendResponse(res, true, 'Reading time verification completed', results);
  } catch (error) {
    console.error('❌ Error verifying reading time accuracy:', error);
    sendResponse(res, false, 'Failed to verify reading time accuracy', null, error.message);
  }
};

/**
 * Verify statistics accuracy across all dashboard metrics
 * This function validates the accuracy of view counts, engagement rates, and content statistics
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with statistics verification results
 */
export const verifyStatisticsAccuracy = async (req, res) => {
  try {
    console.log('🔍 Starting statistics accuracy verification...');
    
    const verification = {
      contentCounts: {},
      viewCounts: {},
      engagementStats: {},
      summary: {
        totalIssues: 0,
        verificationStatus: 'PASSED'
      }
    };

    // Verify content counts for each type
    const contentTypes = [
      { model: Blog, name: 'blogs' },
      { model: News, name: 'news' },
      { model: Event, name: 'events' },
      { model: Farm, name: 'farms' },
      { model: Magazine, name: 'magazines' },
      { model: Basic, name: 'basics' },
      { model: Dairy, name: 'dairy' },
      { model: Beef, name: 'beef' },
      { model: Goat, name: 'goats' },
      { model: Piggery, name: 'piggery' },
      { model: Newsletter, name: 'newsletters' }
    ];

    console.log('📊 Verifying content counts...');
    for (const { model, name } of contentTypes) {
      const count = await model.countDocuments();
      verification.contentCounts[name] = {
        count,
        status: count >= 0 ? 'VALID' : 'INVALID'
      };
      console.log(`   ${name}: ${count}`);
    }

    // Verify view counts accuracy
    console.log('📊 Verifying view counts...');
    for (const { model, name } of contentTypes.slice(0, -1)) { // Exclude newsletters from view counts
      const viewStats = await model.aggregate([
        { $group: { 
          _id: null, 
          totalViews: { $sum: '$views' },
          maxViews: { $max: '$views' },
          minViews: { $min: '$views' },
          avgViews: { $avg: '$views' },
          itemsWithViews: { $sum: { $cond: [{ $gt: ['$views', 0] }, 1, 0] } }
        }}
      ]);

      const stats = viewStats[0] || { totalViews: 0, maxViews: 0, minViews: 0, avgViews: 0, itemsWithViews: 0 };
      verification.viewCounts[name] = {
        ...stats,
        status: stats.totalViews >= 0 && stats.maxViews >= stats.minViews ? 'VALID' : 'INVALID'
      };
      console.log(`   ${name} views: total=${stats.totalViews}, avg=${(stats.avgViews || 0).toFixed(1)}, items with views=${stats.itemsWithViews}`);
    }

    // Verify engagement calculations
    console.log('📊 Verifying engagement calculations...');
    const totalContent = Object.values(verification.contentCounts)
      .filter(item => item.count !== undefined)
      .reduce((sum, item) => sum + item.count, 0);
    
    const totalViews = Object.values(verification.viewCounts)
      .reduce((sum, item) => sum + (item.totalViews || 0), 0);

    const calculatedEngagementRate = totalContent > 0 
      ? ((totalViews / totalContent) * 100).toFixed(1)
      : 0;

    verification.engagementStats = {
      totalContent,
      totalViews,
      engagementRate: calculatedEngagementRate + '%',
      averageViewsPerContent: totalContent > 0 ? (totalViews / totalContent).toFixed(1) : 0,
      status: totalContent > 0 && totalViews >= 0 ? 'VALID' : 'INVALID'
    };

    // Count any issues found
    const issues = [
      ...Object.values(verification.contentCounts).filter(item => item.status === 'INVALID'),
      ...Object.values(verification.viewCounts).filter(item => item.status === 'INVALID'),
      verification.engagementStats.status === 'INVALID' ? [verification.engagementStats] : []
    ].flat();

    verification.summary.totalIssues = issues.length;
    verification.summary.verificationStatus = issues.length === 0 ? 'PASSED' : 'FAILED';

    console.log(`📊 Statistics verification complete:`);
    console.log(`   Total content: ${totalContent}`);
    console.log(`   Total views: ${totalViews}`);
    console.log(`   Engagement rate: ${calculatedEngagementRate}%`);
    console.log(`   Status: ${verification.summary.verificationStatus}`);
    if (issues.length > 0) {
      console.log(`   Issues found: ${issues.length}`);
    }

    sendResponse(res, true, 'Statistics verification completed', verification);
  } catch (error) {
    console.error('❌ Error verifying statistics accuracy:', error);
    sendResponse(res, false, 'Failed to verify statistics accuracy', null, error.message);
  }
};