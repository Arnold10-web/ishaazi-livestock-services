/**
 * PERFORMANCE OPTIMIZED SEARCH MIDDLEWARE
 * Adds caching and optimized queries for search operations
 */

import { cacheMiddleware } from './cache.js';

// Search-specific cache configuration
const searchCacheConfig = {
  // Cache search results for 5 minutes
  searchResults: cacheMiddleware(300),
  // Cache suggestions for 15 minutes  
  suggestions: cacheMiddleware(900),
  // Cache categories/tags for 1 hour
  metadata: cacheMiddleware(3600)
};

// Search performance monitoring
let searchMetrics = {
  totalSearches: 0,
  avgResponseTime: 0,
  slowQueries: [],
  popularQueries: new Map()
};

export const trackSearchPerformance = (req, res, next) => {
  const startTime = Date.now();
  
  // Track popular queries
  const query = req.query.q || req.query.search;
  if (query) {
    const count = searchMetrics.popularQueries.get(query) || 0;
    searchMetrics.popularQueries.set(query, count + 1);
  }
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Update metrics
    searchMetrics.totalSearches++;
    searchMetrics.avgResponseTime = 
      (searchMetrics.avgResponseTime * (searchMetrics.totalSearches - 1) + duration) / 
      searchMetrics.totalSearches;
    
    // Track slow queries (>500ms)
    if (duration > 500) {
      searchMetrics.slowQueries.push({
        query,
        duration,
        timestamp: new Date(),
        url: req.url
      });
      
      // Keep only last 100 slow queries
      if (searchMetrics.slowQueries.length > 100) {
        searchMetrics.slowQueries = searchMetrics.slowQueries.slice(-100);
      }
    }
  });
  
  next();
};

// Search query optimization
export const optimizeSearchQuery = (searchTerm) => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return null;
  }
  
  // Remove special characters and normalize
  const normalized = searchTerm
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ');
  
  // Build optimized MongoDB text search query
  const words = normalized.split(' ').filter(word => word.length > 2);
  
  if (words.length === 0) return null;
  
  // Use phrase search for better relevance
  return words.length === 1 ? words[0] : `"${words.join(' ')}"`;
};

// Get search performance metrics
export const getSearchMetrics = () => {
  return {
    ...searchMetrics,
    popularQueries: Array.from(searchMetrics.popularQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  };
};

export { searchCacheConfig };
