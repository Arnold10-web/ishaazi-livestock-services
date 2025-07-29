/**
 * PERFORMANCE OPTIMIZED SEARCH MIDDLEWARE
 * Adds caching, query optimization, and performance tracking for search operations
 */

import { cacheMiddleware } from './cache.js';

// Search-specific cache configuration with automatic invalidation
const searchCacheConfig = {
  // Cache search results for 5 minutes
  searchResults: cacheMiddleware(300),
  // Cache suggestions for 15 minutes  
  suggestions: cacheMiddleware(900),
  // Cache categories/tags for 1 hour
  metadata: cacheMiddleware(3600)
};

// Enhanced search performance monitoring
let searchMetrics = {
  totalSearches: 0,
  avgResponseTime: 0,
  slowQueries: [],
  popularQueries: new Map(),
  cacheHitRate: 0,
  cacheHits: 0,
  cacheMisses: 0,
  optimizationsApplied: 0
};

export const trackSearchPerformance = (req, res, next) => {
  const startTime = Date.now();
  
  // Track popular queries
  const query = req.query.q || req.query.search || req.query.query;
  if (query) {
    const count = searchMetrics.popularQueries.get(query) || 0;
    searchMetrics.popularQueries.set(query, count + 1);
  }
  
  // Track cache performance
  const originalSend = res.send;
  res.send = function(data) {
    // Check if response came from cache
    if (res.get('X-Cache') === 'HIT') {
      searchMetrics.cacheHits++;
    } else {
      searchMetrics.cacheMisses++;
    }
    
    // Update cache hit rate
    const totalRequests = searchMetrics.cacheHits + searchMetrics.cacheMisses;
    searchMetrics.cacheHitRate = totalRequests > 0 ? 
      (searchMetrics.cacheHits / totalRequests * 100).toFixed(2) : 0;
    
    return originalSend.call(this, data);
  };
  
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
    
    // Log performance
    console.log(`🔍 Search Performance: ${duration}ms for "${query || 'unknown'}" (Cache: ${res.get('X-Cache') || 'MISS'})`);
  });
  
  next();
};

// Enhanced search query optimization
export const optimizeSearchQuery = (searchTerm) => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return null;
  }
  
  // Track optimization applications
  searchMetrics.optimizationsApplied++;
  
  // Remove special characters and normalize
  const normalized = searchTerm
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ');
  
  // Build optimized MongoDB text search query
  const words = normalized.split(' ').filter(word => word.length > 2);
  
  if (words.length === 0) return null;
  
  // Use phrase search for better relevance scoring
  if (words.length === 1) {
    return words[0];
  } else {
    // For multiple words, use both phrase search and individual words
    const phraseSearch = `"${words.join(' ')}"`;
    const individualWords = words.join(' ');
    return `${phraseSearch} ${individualWords}`;
  }
};

// Get enhanced search performance metrics
export const getSearchMetrics = () => {
  return {
    ...searchMetrics,
    popularQueries: Array.from(searchMetrics.popularQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    cacheHitRate: `${searchMetrics.cacheHitRate}%`,
    performance: {
      avgResponseTime: `${searchMetrics.avgResponseTime.toFixed(2)}ms`,
      totalOptimizations: searchMetrics.optimizationsApplied,
      slowQueriesCount: searchMetrics.slowQueries.length
    }
  };
};

export { searchCacheConfig };
