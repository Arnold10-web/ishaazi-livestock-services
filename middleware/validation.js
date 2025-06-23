/**
 * Validation Middleware
 * 
 * This middleware provides centralized request validation using Joi schemas.
 * It includes predefined validation schemas for all major content types
 * in the application (blogs, news, users, events, etc.) and provides
 * consistent error responses for validation failures.
 * 
 * The middleware supports validation for request body, query parameters,
 * and URL parameters with detailed error messages for better client feedback.
 * 
 * @module middleware/validation
 */
import Joi from 'joi';
import { isValidObjectId } from './sanitization.js';

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Property to validate (body, query, params)
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    // Special handling for blog posts with author in metadata
    if (req.originalUrl.includes('/blogs') && req[property].metadata && !req[property].author) {
      try {
        // Try to parse metadata if it's a string
        const metadata = typeof req[property].metadata === 'string' 
          ? JSON.parse(req[property].metadata) 
          : req[property].metadata;
          
        // If metadata contains author, add it to the top level
        if (metadata && metadata.author) {
          req[property].author = metadata.author;
        }
      } catch (err) {
        console.error('Error parsing metadata:', err);
        // Continue with validation even if metadata parsing fails
      }
    }
    
    // If no author is provided anywhere, set a default one for blogs
    if (req.originalUrl.includes('/blogs') && !req[property].author) {
      req[property].author = 'Unknown Author';
    }
    
    // Handle blog tags before validation
    if (req.originalUrl.includes('/blogs') && req[property].tags) {
      try {
        // If it's a string that looks like an array, parse it
        if (typeof req[property].tags === 'string' && 
            req[property].tags.trim().startsWith('[') && 
            req[property].tags.trim().endsWith(']')) {
          console.log('Parsing tags JSON string before validation');
          req[property].tags = JSON.parse(req[property].tags);
        }
      } catch (err) {
        console.error('Error pre-parsing tags:', err);
        // Continue with validation, the schema will handle this
      }
    }
    
    const { error } = schema.validate(req[property], { 
      abortEarly: false,
      // Allow conversions between types (e.g., string to array)
      convert: true 
    });
    
    if (error) {
      console.log('Validation error:', error.details);
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

/**
 * Blog validation schemas
 */
export const blogSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required().messages({
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
    content: Joi.string().min(10).required().messages({
      'string.min': 'Content must be at least 10 characters long',
      'any.required': 'Content is required'
    }),
    // Make author optional
    author: Joi.string().min(2).max(100).optional(),
    // Allow metadata to contain author information
    metadata: Joi.alternatives().try(
      Joi.string(),
      Joi.object({
        author: Joi.string().optional(),
        keywords: Joi.array().items(Joi.string()).optional(),
        summary: Joi.string().optional()
      }).unknown(true)
    ).optional(),
    category: Joi.string().valid('Agriculture', 'Livestock', 'Technology', 'General', 'News').default('General'),
    // Accept any type for tags (we'll handle conversion in the controller)
    tags: Joi.any().optional(),
    summary: Joi.string().max(500).optional(),
    published: Joi.boolean().default(false),
    featured: Joi.boolean().default(false),
    readTime: Joi.number().min(1).max(120).default(5)
  }),
  
  update: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    content: Joi.string().min(10).optional(),
    author: Joi.string().min(2).max(100).optional(),
    // Allow metadata to contain author information
    metadata: Joi.alternatives().try(
      Joi.string(),
      Joi.object({
        author: Joi.string().optional(),
        keywords: Joi.array().items(Joi.string()).optional(),
        summary: Joi.string().optional()
      }).unknown(true)
    ).optional(),
    category: Joi.string().valid('Agriculture', 'Livestock', 'Technology', 'General', 'News').optional(),
    // Accept any type for tags (we'll handle conversion in the controller)
    tags: Joi.any().optional(),
    summary: Joi.string().max(500).optional(),
    published: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).optional(),
    featured: Joi.boolean().optional(),
    readTime: Joi.number().min(1).max(120).optional()
  })
};

/**
 * News validation schemas
 */
export const newsSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required().messages({
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
    content: Joi.string().min(10).required().messages({
      'string.min': 'Content must be at least 10 characters long',
      'any.required': 'Content is required'
    }),
    // Make author optional like blogs
    author: Joi.string().min(2).max(100).optional(),
    // Allow metadata to contain any structure like blogs
    metadata: Joi.alternatives().try(
      Joi.string(),
      Joi.object({
        keywords: Joi.array().items(Joi.string()).optional(),
        summary: Joi.string().optional(),
        location: Joi.string().optional()
      }).unknown(true)
    ).optional(),
    category: Joi.string().valid('Breaking', 'Market', 'Weather', 'Policy', 'General').default('General'),
    // Accept any type for tags like blogs (we'll handle conversion in the controller)
    tags: Joi.any().optional(),
    published: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).default(false),
    featured: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).default(false),
    isBreaking: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).default(false)
  }),
  
  update: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    content: Joi.string().min(10).optional(),
    author: Joi.string().min(2).max(100).optional(),
    metadata: Joi.alternatives().try(
      Joi.string(),
      Joi.object().unknown(true)
    ).optional(),
    category: Joi.string().valid('Breaking', 'Market', 'Weather', 'Policy', 'General').optional(),
    tags: Joi.any().optional(),
    published: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).optional(),
    featured: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).optional(),
    isBreaking: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).optional()
  })
};

/**
 * Magazine validation schemas
 */
export const magazineSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(500).required(),
    description: Joi.string().min(1).required(),
    issue: Joi.string().min(1).max(100).required(),
    price: Joi.number().min(0).optional(),
    discount: Joi.number().min(0).max(100).optional(),
    imageUrl: Joi.string().uri().optional().allow(null, ''),
    fileUrl: Joi.string().uri().optional().allow(null, ''), // Will be set by file upload middleware
    author: Joi.string().max(200).optional().allow(''),
    category: Joi.string().valid(
      'General',
      'Livestock',
      'Crops',
      'Technology',
      'Sustainability',
      'Business',
      'Market',
      'Equipment',
      'Nutrition',
      'Research'
    ).optional(),
    tags: Joi.any().optional(), // Flexible tags like news/blogs
    metadata: Joi.any().optional(), // Flexible metadata storage
    published: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).optional(),
    featured: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).optional()
  }),
  
  update: Joi.object({
    title: Joi.string().min(1).max(500).optional(),
    description: Joi.string().min(1).optional(),
    issue: Joi.string().min(1).max(100).optional(),
    price: Joi.number().min(0).optional(),
    discount: Joi.number().min(0).max(100).optional(),
    imageUrl: Joi.string().uri().optional().allow(null, ''),
    fileUrl: Joi.string().uri().optional().allow(null, ''),
    author: Joi.string().max(200).optional().allow(''),
    category: Joi.string().valid(
      'General',
      'Livestock', 
      'Crops',
      'Technology',
      'Sustainability',
      'Business',
      'Market',
      'Equipment',
      'Nutrition',
      'Research'
    ).optional(),
    tags: Joi.any().optional(),
    metadata: Joi.any().optional(),
    published: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).optional(),
    featured: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).optional()
  })
};

/**
 * User/Admin validation schemas
 */
export const userSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
    role: Joi.string().valid('admin', 'editor', 'user').default('user')
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    currentPassword: Joi.string().when('newPassword', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).optional()
  })
};

/**
 * Comment validation schema
 */
export const commentSchema = Joi.object({
  author: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  content: Joi.string().min(5).max(1000).required().messages({
    'string.min': 'Comment must be at least 5 characters long',
    'string.max': 'Comment cannot exceed 1000 characters'
  })
});

/**
 * Search and query validation
 */
export const querySchemas = {
  search: Joi.object({
    q: Joi.string().max(200).optional(),
    category: Joi.string().max(50).optional(),
    tags: Joi.string().max(200).optional(),
    author: Joi.string().max(100).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('createdAt', 'updatedAt', 'title', 'views', 'likes').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

/**
 * File upload validation
 */
export const fileUploadSchema = Joi.object({
  mimetype: Joi.string().valid(
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf'
  ).required(),
  size: Joi.number().max(10 * 1024 * 1024).required() // 10MB max
});

/**
 * MongoDB ObjectId validation middleware
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

/**
 * Validate file upload - making file optional
 */
export const validateFileUpload = (req, res, next) => {
  // If no file is uploaded, just continue - files are optional
  if (!req.file) {
    return next();
  }
  
  // If a file is uploaded, validate it
  const { error } = fileUploadSchema.validate({
    mimetype: req.file.mimetype,
    size: req.file.size
  });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file',
      error: error.details[0].message
    });
  }
  
  next();
};

export default {
  validate,
  blogSchemas,
  newsSchemas,
  magazineSchemas,
  userSchemas,
  commentSchema,
  querySchemas,
  validateObjectId,
  validateFileUpload
};
