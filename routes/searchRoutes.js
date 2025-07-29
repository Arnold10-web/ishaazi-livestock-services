// Enhanced searchRoutes.js with advanced features and performance monitoring
import express from 'express';
import rateLimit from 'express-rate-limit';
import * as SearchController from '../controllers/searchController.js';
import { 
  searchPerformanceMiddleware, 
  getPerformanceMetrics, 
  resetPerformanceMetrics 
} from '../middleware/performanceMonitor.js';
import { 
  trackSearchPerformance,
  searchCacheConfig,
  getSearchMetrics
} from '../middleware/searchOptimization.js';

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

// Apply performance monitoring and search optimization to all search routes
router.use(searchPerformanceMiddleware);
router.use(trackSearchPerformance);

// Apply rate limiting to search routes
router.use('/all', searchRateLimit);
router.use('/filter', searchRateLimit);
router.use('/suggestions', suggestionRateLimit);

// Search across all content types with caching
router.get('/all', searchCacheConfig.searchResults, SearchController.searchAll);

// Filter content by specific criteria with caching
router.get('/filter', searchCacheConfig.searchResults, SearchController.filterContent);

// Get categories for a specific content type with long-term caching
router.get('/categories/:contentType', searchCacheConfig.metadata, SearchController.getCategories);

// Get tags for a specific content type with long-term caching
router.get('/tags/:contentType', searchCacheConfig.metadata, SearchController.getTags);

// Get search suggestions/autocomplete with caching
router.get('/suggestions', searchCacheConfig.suggestions, SearchController.getSearchSuggestions);

// Track search analytics
router.post('/analytics/track', SearchController.trackSearchAnalytics);

// Get search analytics (admin only - you might want to add auth middleware)
router.get('/analytics', SearchController.getSearchAnalytics);

// Performance monitoring endpoints
router.get('/performance/metrics', getPerformanceMetrics);
router.post('/performance/reset', resetPerformanceMetrics);

// Search optimization metrics endpoint
router.get('/optimization/metrics', (req, res) => {
  try {
    const metrics = getSearchMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve search optimization metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
