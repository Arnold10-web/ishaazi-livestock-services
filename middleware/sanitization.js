/**
 * @file Sanitization Middleware
 * @description Provides comprehensive security features:
 *  - HTML and text sanitization to prevent XSS attacks
 *  - Input validation for common data formats
 *  - Rate limiting for sensitive operations
 *  - Security headers for enhanced browser protection
 * @module middleware/sanitization
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import rateLimit from 'express-rate-limit';

/**
 * Create a DOM window for DOMPurify to work in Node.js environment
 * @const {Window} window - JSDOM window object
 */
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - The potentially unsafe HTML string
 * @returns {string} - The sanitized HTML string
 */
export const sanitizeHTML = (dirty) => {
  if (typeof dirty !== 'string') return dirty;
  
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
  });
};

/**
 * Sanitize plain text to prevent injection attacks
 * @param {string} text - The text to sanitize
 * @returns {string} - The sanitized text
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return text;
  
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * @function sanitizeInput
 * @description Express middleware that sanitizes all request inputs (body, query, params)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  
  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }
  
  next();
};

/**
 * @function sanitizeObject
 * @description Recursively sanitizes all string values in an object
 * - Applies HTML sanitization to content-related fields
 * - Applies text sanitization to all other string fields
 * - Recursively processes nested objects
 * @param {Object} obj - The object to sanitize
 * @private
 */
const sanitizeObject = (obj) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        // Special handling for content fields that may contain HTML
        if (key === 'content' || key === 'description' || key === 'summary' || key === 'body') {
          obj[key] = sanitizeHTML(obj[key]);
        } else {
          obj[key] = sanitizeText(obj[key]);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId format
 */
export const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * @constant {Object} sensitiveOperationLimiter
 * @description Rate limiting middleware for sensitive operations
 * - Production: 100 requests per 15 minutes per IP
 * - Development: 1000 requests per 15 minutes per IP (higher limit)
 * - Provides customized error messages
 * - Enhanced security headers and monitoring
 */
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    success: false,
    message: 'Too many sensitive operations from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Enhanced skip logic for development
  skip: (req) => {
    // Skip rate limiting in development environment
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Also skip for localhost in development
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
    
    return isDevelopment && isLocalhost;
  }
});

/**
 * @function securityHeaders
 * @description Middleware that applies security headers to all responses
 * - X-Frame-Options: Prevents clickjacking attacks
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-XSS-Protection: Browser XSS filtering
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Restricts browser feature usage
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeInput,
  isValidEmail,
  isValidObjectId,
  sensitiveOperationLimiter,
  securityHeaders
};
