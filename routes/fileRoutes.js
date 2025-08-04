import express from 'express';
import mongoose from 'mongoose';
import { streamFile } from '../controllers/fileController.js';
import { authenticateToken } from '../middleware/enhancedAuthMiddleware.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { enhancedFileServing } from '../middleware/enhancedFileServing.js';
import { performanceMonitor } from '../utils/unifiedPerformance.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// CRITICAL: Rate limiting for file access
const fileAccessLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute per IP
  message: {
    success: false,
    message: 'Too many file requests. Please try again later.'
  }
});

/**
 * @route GET /api/files/:fileId
 * @desc Stream a file from GridFS - ENHANCED SECURITY
 * @access Public for images, Private for other files
 */
router.get('/:fileId', 
  fileAccessLimiter,
  performanceMonitor('file-serving'),
  cacheMiddleware(3600), 
  (req, res, next) => {
    // Log file access for security monitoring
    console.log(`🔍 File access: ${req.params.fileId} from IP: ${req.ip}`);
    console.log(`🔍 File ID validation: Valid ObjectId = ${mongoose.Types.ObjectId.isValid(req.params.fileId)}`);
    next();
  },
  enhancedFileServing
);

/**
 * @route GET /api/files/protected/:fileId
 * @desc Stream a protected file from GridFS
 * @access Private
 */
router.get('/protected/:fileId', 
  fileAccessLimiter,
  authenticateToken,
  performanceMonitor('protected-file-serving'),
  enhancedFileServing
);

export default router;
