// Enhanced Caching Middleware
import logger from '../utils/logger.js';

// In-memory cache storage
const cache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
  totalRequests: 0
};

// Cache configuration
const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000, // Maximum number of cache entries
  cleanupInterval: 10 * 60 * 1000, // Cleanup every 10 minutes
  profiles: {
    'short': 60 * 1000,          // 1 minute
    'medium': 5 * 60 * 1000,     // 5 minutes  
    'long': 30 * 60 * 1000,      // 30 minutes
    'static': 24 * 60 * 60 * 1000 // 24 hours
  }
};

/**
 * Cache entry structure
 */
class CacheEntry {
  constructor(data, ttl = CACHE_CONFIG.defaultTTL) {
    this.data = data;
    this.createdAt = Date.now();
    this.expiresAt = Date.now() + ttl;
    this.hits = 0;
    this.lastAccessed = Date.now();
  }

  isExpired() {
    return Date.now() > this.expiresAt;
  }

  touch() {
    this.hits++;
    this.lastAccessed = Date.now();
  }
}

/**
 * Cache cleanup to prevent memory leaks
 */
const cleanupCache = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of cache.entries()) {
    if (entry.isExpired()) {
      cache.delete(key);
      cleaned++;
    }
  }

  // If cache is still too large, remove least recently used entries
  if (cache.size > CACHE_CONFIG.maxSize) {
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const toRemove = cache.size - CACHE_CONFIG.maxSize;
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`Cache cleanup: removed ${cleaned} entries, size: ${cache.size}`);
  }
};

// Start cleanup interval
setInterval(cleanupCache, CACHE_CONFIG.cleanupInterval);

/**
 * Generate cache key from request
 */
const generateCacheKey = (req) => {
  const { method, path, query, user } = req;
  const queryString = Object.keys(query || {})
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
  
  const userId = user?.id || 'anonymous';
  return `${method}:${path}:${queryString}:${userId}`;
};

/**
 * Smart caching middleware with configurable strategies
 */
export const smartCache = (options = {}) => {
  const {
    ttl = CACHE_CONFIG.defaultTTL,
    profile = 'medium',
    condition = () => true,
    keyGenerator = generateCacheKey,
    vary = [],
    skipCache = false
  } = options;

  const cacheTTL = profile && CACHE_CONFIG.profiles[profile] 
    ? CACHE_CONFIG.profiles[profile] 
    : ttl;

  return (req, res, next) => {
    // Skip caching if disabled or condition not met
    if (skipCache || !condition(req)) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);
    cacheStats.totalRequests++;

    // Check cache
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && !cachedEntry.isExpired()) {
      cachedEntry.touch();
      cacheStats.hits++;
      
      // Set cache headers
      res.set({
        'X-Cache': 'HIT',
        'X-Cache-Key': cacheKey,
        'Cache-Control': `max-age=${Math.floor((cachedEntry.expiresAt - Date.now()) / 1000)}`
      });

      logger.debug(`Cache HIT: ${cacheKey}`);
      return res.json(cachedEntry.data);
    }

    cacheStats.misses++;

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entry = new CacheEntry(data, cacheTTL);
        cache.set(cacheKey, entry);
        
        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `max-age=${Math.floor(cacheTTL / 1000)}`
        });

        logger.debug(`Cache MISS: ${cacheKey}, TTL: ${cacheTTL}ms`);
      }

      originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Route-specific caching profiles
 */
export const cacheProfiles = {
  // Static content - cache for 24 hours
  static: smartCache({ profile: 'static' }),
  
  // Blog posts - cache for 30 minutes
  blog: smartCache({ 
    profile: 'long',
    condition: (req) => !req.user || req.user.role !== 'admin'
  }),
  
  // News - cache for 5 minutes
  news: smartCache({ 
    profile: 'medium',
    condition: (req) => !req.user || req.user.role !== 'admin'
  }),
  
  // Events - cache for 5 minutes
  events: smartCache({ profile: 'medium' }),
  
  // Search results - cache for 1 minute
  search: smartCache({ profile: 'short' }),
  
  // User-specific data - very short cache
  userSpecific: smartCache({ 
    ttl: 30 * 1000, // 30 seconds
    condition: (req) => !!req.user
  })
};

/**
 * Cache invalidation
 */
export const invalidateCache = (pattern) => {
  let removed = 0;
  
  if (typeof pattern === 'string') {
    // Exact key match
    if (cache.has(pattern)) {
      cache.delete(pattern);
      removed = 1;
    }
  } else if (pattern instanceof RegExp) {
    // Pattern matching
    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
        removed++;
      }
    }
  } else if (typeof pattern === 'function') {
    // Custom function
    for (const [key, entry] of cache.entries()) {
      if (pattern(key, entry)) {
        cache.delete(key);
        removed++;
      }
    }
  }

  logger.info(`Cache invalidation: removed ${removed} entries`);
  return removed;
};

/**
 * Cache middleware for specific routes
 */
export const cacheRoute = (profile = 'medium') => {
  return smartCache({ profile });
};

/**
 * Cache statistics endpoint
 */
export const getCacheStats = () => {
  const hitRate = cacheStats.totalRequests > 0 
    ? ((cacheStats.hits / cacheStats.totalRequests) * 100).toFixed(2)
    : 0;

  return {
    size: cache.size,
    maxSize: CACHE_CONFIG.maxSize,
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    totalRequests: cacheStats.totalRequests,
    hitRate: `${hitRate}%`,
    memoryUsage: {
      entries: cache.size,
      estimatedSize: cache.size * 1000 // Rough estimate
    }
  };
};

/**
 * Clear all cache
 */
export const clearCache = () => {
  const size = cache.size;
  cache.clear();
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.totalRequests = 0;
  
  logger.info(`Cache cleared: removed ${size} entries`);
  return size;
};

/**
 * HTTP cache headers middleware
 */
export const httpCacheHeaders = (maxAge = 300) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set({
        'Cache-Control': `public, max-age=${maxAge}`,
        'Expires': new Date(Date.now() + maxAge * 1000).toUTCString(),
        'ETag': `"${Date.now()}"`, // Simple ETag
        'Last-Modified': new Date().toUTCString()
      });
    }
    next();
  };
};

export default {
  smartCache,
  cacheProfiles,
  invalidateCache,
  cacheRoute,
  getCacheStats,
  clearCache,
  httpCacheHeaders
};
