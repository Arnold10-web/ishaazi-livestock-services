import express from 'express';
import { streamFile } from '../controllers/fileController.js';
import { authenticateToken } from '../middleware/enhancedAuthMiddleware.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

/**
 * @route GET /api/files/:fileId
 * @desc Stream a file from GridFS
 * @access Public for images, Private for other files
 */
router.get('/:fileId', cacheMiddleware(3600), streamFile);

/**
 * @route GET /api/files/protected/:fileId
 * @desc Stream a protected file from GridFS
 * @access Private
 */
router.get('/protected/:fileId', authenticateToken, streamFile);

export default router;
