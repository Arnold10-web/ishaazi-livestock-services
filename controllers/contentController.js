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
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { sendNewsletter as sendNewsletterEmail, sendWelcomeEmail } from '../services/emailService.js';

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
 * Parse and validate metadata JSON 
 * 
 * @param {string|null} metadata - Metadata as JSON string
 * @returns {Object} Parsed metadata object
 * @throws {Error} If metadata is not valid JSON
 */
const parseMetadata = (metadata) => {
  try {
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
const sendResponse = (res, success, message, data = null, error = null) => {
  res.status(success ? 200 : 500).json({ success, message, data, error });
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

// Comment management for all content types
export const addContentComment = async (req, res) => {
  try {
    const { contentType, id } = req.params;
    const { author, email, content } = req.body;

    if (!author || !email || !content) {
      return sendResponse(res, false, 'Author, email, and content are required');
    }

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

    const newComment = {
      author,
      email,
      content,
      approved: false // Comments require approval by default
    };

    item.comments = item.comments || [];
    item.comments.push(newComment);
    await item.save();

    sendResponse(res, true, 'Comment added successfully (pending approval)', item);
  } catch (error) {
    sendResponse(res, false, 'Failed to add comment', null, error.message);
  }
};

// Delete comment from any content type
export const deleteContentComment = async (req, res) => {
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

    item.comments = item.comments.filter(comment => comment._id.toString() !== commentId);
    await item.save();

    sendResponse(res, true, 'Comment deleted successfully', item);
  } catch (error) {
    sendResponse(res, false, 'Failed to delete comment', null, error.message);
  }
};

// Approve comment for any content type
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
    const { title, content, author, category, tags, metadata, published } = req.body;
    let imageUrl = null;

    if (!title || !content || !author) {
      return sendResponse(res, false, 'Title, content, and author are required.');
    }

    if (req.file) {
      // Construct the relative path
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);
    
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

    const newBlog = new Blog({
      title,
      content,
      author,
      category: category || 'General',
      tags: parsedTags,
      imageUrl,
      metadata: parsedMetadata,
      published: published === 'true' || published === true || published === "true"
    });

    const savedBlog = await newBlog.save();
    sendResponse(res, true, 'Blog created successfully', savedBlog);
  } catch (error) {
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
    const query = admin ? {} : { published: true };

    console.log("🔥 API HIT: Fetching blogs...");
    console.log("🔍 Query:", query);

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
    if (blogs.length > 0) console.log("Sample blog:", blogs[0]);

    const total = await Blog.countDocuments(query);

    sendResponse(res, true, 'Blogs retrieved successfully', { blogs, total, page, limit });
  } catch (error) {
    console.error("❌ Error fetching blogs:", error);
    sendResponse(res, false, 'Failed to retrieve blogs', null, error.message);
  }
};
export const getAdminBlogs = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
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

    if (req.file) {
      // Construct the relative path
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
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

    // Delete the associated image file if it exists
    if (blog.imageUrl) {
      const imagePath = path.join(__dirname, '..', blog.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the blog from the database
    await Blog.findByIdAndDelete(id);

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Failed to delete blog' });
  }
};
// ----- NEWS CRUD -----
export const createNews = async (req, res) => {
  try {
    const { title, content, metadata, published, isBreaking } = req.body;
    let imageUrl = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.');
    }

    if (req.file) {
      // Construct the relative path
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newNews = new News({
      title,
      content,
      imageUrl,
      metadata: parsedMetadata,
      published,
      isBreaking: isBreaking === 'true' || isBreaking === true
    });

    const savedNews = await newNews.save();
    sendResponse(res, true, 'News created successfully', savedNews);
  } catch (error) {
    sendResponse(res, false, 'Failed to create news', null, error.message);
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
  const { page = 1, limit = 10 } = req.query;
  
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
    let updateData = { 
      title, 
      content, 
      metadata, 
      published,
      isBreaking: isBreaking === 'true' || isBreaking === true
    };

    if (req.file) {
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedNews = await News.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedNews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Delete the associated image file if it exists
    if (news.imageUrl) {
      const imagePath = path.join(__dirname, '..', news.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the news from the database
    await News.findByIdAndDelete(id);

    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ message: 'Failed to delete news' });
  }
};

// ----- BASIC CRUD OPERATIONS -----

// Create a new Basic media
export const createBasic = async (req, res) => {
  try {
    const { title, description, fileType, metadata } = req.body;

    // Extract uploaded files
    const files = req.files || {};
    const image = files.image?.[0]; // Thumbnail
    const media = files.media?.[0]; // Video/Audio

    // Ensure media file is provided
    if (!title || !description || !fileType || !media) {
      return sendResponse(res, false, 'Title, description, file type, and media file are required.');
    }

    // Construct file paths
    const fileUrl = `/uploads/media/${media.filename}`;
    const imageUrl = image ? `/uploads/images/${image.filename}` : null;

    // Parse metadata
    const parsedMetadata = metadata ? JSON.parse(metadata) : {};

    // Create and save Basic media
    const newBasic = new Basic({
      title,
      description,
      fileUrl,
      imageUrl,
      fileType,
      metadata: parsedMetadata,
    });

    const savedBasic = await newBasic.save();
    sendResponse(res, true, 'Basic media created successfully', savedBasic);
  } catch (error) {
    sendResponse(res, false, 'Failed to create basic media', null, error.message);
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
  const { page = 1, limit = 10 } = req.query;

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
    const { title, description, fileType, metadata } = req.body;

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

    if (media) {
      updateData.fileUrl = `/uploads/media/${media.filename}`;
    }
    if (image) {
      updateData.imageUrl = `/uploads/images/${image.filename}`;
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

    // Delete associated media files
    if (basic.fileUrl) {
      const filePath = normalizePath(basic.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (basic.imageUrl) {
      const imagePath = normalizePath(basic.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
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
    let imageUrl = null;

    if (!name || !location || !price || !description) {
      return sendResponse(res, false, 'Name, location, price, and description are required.');
    }

    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newFarm = new Farm({
      name,
      location,
      price,
      description,
      imageUrl,
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
  const { page = 1, limit = 10 } = req.query;

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
    let updateData = { name, location, price, description, metadata };

    if (req.file) {
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
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

    // Delete the associated image file if it exists
    if (farm.imageUrl) {
      const imagePath = path.join(__dirname, '..', farm.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
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
  try {
    const { title, description, issue, price, discount, metadata } = req.body;

    // Check required fields
    if (!title || !description || !issue) {
      return sendResponse(res, false, 'Title, description, and issue are required.');
    }

    // Handle file uploads
    const files = req.files || {};
    const image = files.image?.[0];
    const pdf = files.pdf?.[0];

    if (!image || !pdf) {
      return sendResponse(res, false, 'Both image and PDF file are required.');
    }

    const imageUrl = `/uploads/images/${image.filename}`;
    const fileUrl = `/uploads/pdfs/${pdf.filename}`;

    // Parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = parseMetadata(metadata);
    } catch (error) {
      return sendResponse(res, false, 'Invalid metadata format.');
    }

    const newMagazine = new Magazine({
      title,
      description,
      issue,
      price: price || 0,
      discount: discount || 0,
      imageUrl,
      fileUrl,
      metadata: parsedMetadata,
    });

    const savedMagazine = await newMagazine.save();
    sendResponse(res, true, 'Magazine created successfully', savedMagazine);
  } catch (error) {
    console.error('Error creating magazine:', error);
    sendResponse(res, false, 'Failed to create magazine', null, error.message);
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
  const { page = 1, limit = 10 } = req.query;

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

    if (files.image?.[0]) {
      updateData.imageUrl = `/uploads/images/${files.image[0].filename}`;
    }

    if (files.pdf?.[0]) {
      updateData.fileUrl = `/uploads/pdfs/${files.pdf[0].filename}`;
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

    // Delete associated files
    if (magazine.fileUrl) {
      const filePath = normalizePath(magazine.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (magazine.imageUrl) {
      const imagePath = normalizePath(magazine.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
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
    const { title, content, metadata, published } = req.body;
    let imageUrl = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.');
    }

    if (req.file) {
      // Construct the relative path
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newPiggery = new Piggery({
      title,
      content,
      imageUrl,
      metadata: parsedMetadata,
      published
    });

    const savedPiggery = await newPiggery.save();
    sendResponse(res, true, 'Piggery created successfully', savedPiggery);
  } catch (error) {
    sendResponse(res, false, 'Failed to create piggery', null, error.message);
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
  const { page = 1, limit = 10 } = req.query;
  
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
    const { title, content, metadata, published } = req.body;

    // Parse metadata from JSON string to object inline
    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      return res.status(400).json({ message: 'Invalid metadata format' });
    }

    let updateData = { title, content, metadata: parsedMetadata, published };

    if (req.file) {
      // Construct the relative path for the image
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedPiggery = await Piggery.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedPiggery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



export const deletePiggery = async (req, res) => {
  try {
    const { id } = req.params;
    const piggery = await Piggery.findById(id);

    if (!piggery) {
      return res.status(404).json({ message: 'Piggery not found' });
    }

    // Delete the associated image file if it exists
    if (piggery.imageUrl) {
      const imagePath = path.join(__dirname, '..', piggery.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the piggery from the database
    await Piggery.findByIdAndDelete(id);

    res.json({ message: 'Piggery deleted successfully' });
  } catch (error) {
    console.error('Error deleting piggery:', error);
    res.status(500).json({ message: 'Failed to delete piggery' });
  }
};

// ----- GOAT CRUD -----


export const createGoat = async (req, res) => {
  try {
    const { title, content, metadata, published } = req.body;
    let imageUrl = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.');
    }

    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newGoat = new Goat({
      title,
      content,
      imageUrl,
      metadata: parsedMetadata,
      published
    });

    const savedGoat = await newGoat.save();
    sendResponse(res, true, 'Goat content created successfully', savedGoat);
  } catch (error) {
    sendResponse(res, false, 'Failed to create goat content', null, error.message);
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
  const { page = 1, limit = 10 } = req.query;
  
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
    const { title, content, metadata, published } = req.body;

    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      return res.status(400).json({ message: 'Invalid metadata format' });
    }

    let updateData = { title, content, metadata: parsedMetadata, published };

    if (req.file) {
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedGoat = await Goat.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedGoat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



export const deleteGoat = async (req, res) => {
  try {
    const { id } = req.params;
    const goat = await Goat.findById(id);

    if (!goat) {
      return res.status(404).json({ message: 'Goat content not found' });
    }

    if (goat.imageUrl) {
      const imagePath = path.join(__dirname, '..', goat.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Goat.findByIdAndDelete(id);

    res.json({ message: 'Goat content deleted successfully' });
  } catch (error) {
    console.error('Error deleting goat content:', error);
    res.status(500).json({ message: 'Failed to delete goat content' });
  }
};

// ----- DAIRY CRUD -----

export const createDairy = async (req, res) => {
  try {
    const { title, content, metadata, published } = req.body;
    let imageUrl = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.');
    }

    if (req.file) {
      // Construct the relative path
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newDairy = new Dairy({
      title,
      content,
      imageUrl,
      metadata: parsedMetadata,
      published
    });

    const savedDairy = await newDairy.save();
    sendResponse(res, true, 'Dairy content created successfully', savedDairy);
  } catch (error) {
    sendResponse(res, false, 'Failed to create dairy content', null, error.message);
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
  const { page = 1, limit = 10 } = req.query;
  
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
    const { title, content, metadata, published } = req.body;
    // Parse metadata to ensure it's stored as an object:
    const parsedMetadata = parseMetadata(metadata);
    let updateData = { title, content, metadata: parsedMetadata, published };

    if (req.file) {
      // Construct the relative path for the updated image
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedDairy = await Dairy.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedDairy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const deleteDairy = async (req, res) => {
  try {
    const { id } = req.params;
    const dairy = await Dairy.findById(id);

    if (!dairy) {
      return res.status(404).json({ message: 'Dairy content not found' });
    }

    // Delete the associated image file if it exists
    if (dairy.imageUrl) {
      const imagePath = path.join(__dirname, '..', dairy.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the dairy content from the database
    await Dairy.findByIdAndDelete(id);

    res.json({ message: 'Dairy content deleted successfully' });
  } catch (error) {
    console.error('Error deleting dairy content:', error);
    res.status(500).json({ message: 'Failed to delete dairy content' });
  }
};

// ----- BEEF CRUD -----

export const createBeef = async (req, res) => {
  try {
    const { title, content, metadata, published } = req.body;
    let imageUrl = null;

    if (!title || !content) {
      return sendResponse(res, false, 'Title and content are required.');
    }

    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const parsedMetadata = parseMetadata(metadata);

    const newBeef = new Beef({
      title,
      content,
      imageUrl,
      metadata: parsedMetadata,
      published
    });

    const savedBeef = await newBeef.save();
    sendResponse(res, true, 'Beef content created successfully', savedBeef);
  } catch (error) {
    sendResponse(res, false, 'Failed to create beef content', null, error.message);
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
  const { page = 1, limit = 10 } = req.query;
  
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
    const { title, content, metadata, published } = req.body;
    // Parse the metadata string into an object
    const parsedMetadata = parseMetadata(metadata);
    let updateData = { title, content, metadata: parsedMetadata, published };

    if (req.file) {
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedBeef = await Beef.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedBeef) {
      return sendResponse(res, false, 'Beef content not found', null, null, 404);
    }
    sendResponse(res, true, 'Beef content updated successfully', updatedBeef);
  } catch (error) {
    sendResponse(res, false, 'Failed to update beef content', null, error.message);
  }
};


export const deleteBeef = async (req, res) => {
  try {
    const { id } = req.params;
    const beef = await Beef.findById(id);

    if (!beef) {
      return sendResponse(res, false, 'Beef content not found', null, null, 404);
    }

    if (beef.imageUrl) {
      const imagePath = path.join(__dirname, '..', beef.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Beef.findByIdAndDelete(id);

    sendResponse(res, true, 'Beef content deleted successfully');
  } catch (error) {
    console.error('Error deleting beef content:', error);
    sendResponse(res, false, 'Failed to delete beef content', null, error.message);
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
      .skip((page - 1) * limit)
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

        // Send welcome back email
        await sendWelcomeEmail(email, subscriptionType);

        return res.status(200).json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.',
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

    // Send welcome email
    const emailResult = await sendWelcomeEmail(email, subscriptionType);
    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing to our newsletter! Please check your email for confirmation.',
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
  const { title, body, subject, targetSubscriptionTypes = ['all'] } = req.body;
  
  if (!title || !body || !subject) {
    return res.status(400).json({ 
      success: false, 
      message: 'Title, subject, and body are required' 
    });
  }

  try {
    const newsletter = new Newsletter({ 
      title, 
      body, 
      subject,
      targetSubscriptionTypes,
      createdBy: req.admin?._id // Assuming admin info is in request
    });
    await newsletter.save();
    
    res.status(201).json({
      success: true,
      message: 'Newsletter created successfully',
      data: newsletter
    });
  } catch (error) {
    console.error('Error creating newsletter:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error creating newsletter',
      error: error.message 
    });
  }
};

// Enhanced newsletter update
export const updateNewsletter = async (req, res) => {
  try {
    const { title, body, subject, targetSubscriptionTypes } = req.body;
    
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
      { title, body, subject, targetSubscriptionTypes },
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
    let imageUrl = null;

    // Check required fields
    if (!title || !description || !startDate) {
      return sendResponse(res, false, 'Title, description, and start date are required.');
    }

    if (req.file) {
      // Construct the relative path
      imageUrl = `/uploads/images/${req.file.filename}`;
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
      imageUrl,
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
  const { page = 1, limit = 10 } = req.query;
  
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

    if (req.file) {
      // Construct the relative path
      updateData.imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
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

    // Delete the associated image file if it exists
    if (event.imageUrl) {
      const imagePath = path.join(__dirname, '..', event.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
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
    
    let imageUrl = null;

    if (!title || !description || !location || !date || !startTime || !endTime) {
      return sendResponse(res, false, 'Title, description, location, date, start time, and end time are required.');
    }

    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;
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
      imageUrl,
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
  const { page = 1, limit = 10 } = req.query;

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
      // Delete old image
      if (auction.imageUrl) {
        const oldImagePath = normalizePath(auction.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      auction.imageUrl = `/uploads/images/${req.file.filename}`;
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

    // Delete associated image
    if (auction.imageUrl) {
      const imagePath = normalizePath(auction.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
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