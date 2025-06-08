// Enhanced searchRoutes.js with advanced features and performance monitoring
import express from 'express';
import rateLimit from 'express-rate-limit';
import * as SearchController from '../controllers/searchController.js';
import { 
  searchPerformanceMiddleware, 
  getPerformanceMetrics, 
  resetPerformanceMetrics 
} from '../middleware/performanceMonitor.js';

const router = express.Router();

// Rate limiting for search endpoints
const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many search requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const suggestionRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute for suggestions
  message: {
    success: false,
    message: 'Too many suggestion requests, please try again later.'
  }
});

// Apply performance monitoring to all search routes
router.use(searchPerformanceMiddleware);

// Apply rate limiting to search routes
router.use('/all', searchRateLimit);
router.use('/filter', searchRateLimit);
router.use('/suggestions', suggestionRateLimit);

// Search across all content types
router.get('/all', SearchController.searchAll);

// Filter content by specific criteria
router.get('/filter', SearchController.filterContent);

// Get categories for a specific content type
router.get('/categories/:contentType', SearchController.getCategories);

// Get tags for a specific content type
router.get('/tags/:contentType', SearchController.getTags);

// Get search suggestions/autocomplete
router.get('/suggestions', SearchController.getSearchSuggestions);

// Track search analytics
router.post('/analytics/track', SearchController.trackSearchAnalytics);

// Get search analytics (admin only - you might want to add auth middleware)
router.get('/analytics', SearchController.getSearchAnalytics);

// Performance monitoring endpoints
router.get('/performance/metrics', getPerformanceMetrics);
router.post('/performance/reset', resetPerformanceMetrics);

export default router;
