/**
 * @file Cache Middleware
 * @description Redis-based caching system for API performance optimization:
 *  - Singleton cache service for centralized cache management
 *  - Middleware for automatic response caching
 *  - Cache invalidation on data mutations
 *  - Graceful fallback when Redis is unavailable
 * @module middleware/cache
 */

import redis from 'redis';

/**
 * @class CacheService
 * @description Provides Redis-based caching functionality with error handling and fallbacks
 */
class CacheService {
  /**
   * @constructor
   * @description Creates a new CacheService instance and initializes the Redis client
   */
  constructor() {
    /** @private {Object} Redis client instance */
    this.client = null;
    
    /** @private {boolean} Connection status flag */
    this.isConnected = false;
    
    // Initialize the client when service is instantiated
    this.initializeClient();
  }

  /**
   * @method initializeClient
   * @async
   * @description Sets up Redis client with connection handling, retry logic, and error management
   * @private
   */
  async initializeClient() {
    try {
      // Only initialize Redis if REDIS_URL is provided
      if (!process.env.REDIS_URL) {
        console.log('🔄 Redis URL not provided. Running without cache...');
        this.isConnected = false;
        return;
      }

      // Create Redis client with fallback configuration
      this.client = redis.createClient({
        url: process.env.REDIS_URL,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis server connection refused.');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.log('Redis retry time exhausted.');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.log('Redis max retry attempts reached.');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        console.log('📡 Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.warn('⚠️  Redis client error:', err.message);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('📡 Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('⚠️  Redis initialization failed:', error.message);
      console.log('🔄 Continuing without Redis cache...');
      this.isConnected = false;
    }
  }

  /**
   * @method get
   * @async
   * @description Retrieves a value from cache by key with error handling
   * @param {string} key - Cache key to retrieve
   * @returns {Object|null} Parsed cached value or null if not found/error
   */
  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const result = await this.client.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.warn('⚠️  Cache get error:', error.message);
      return null;
    }
  }

  /**
   * @method set
   * @async
   * @description Stores a value in cache with expiration
   * @param {string} key - Cache key
   * @param {*} value - Value to cache (will be JSON stringified)
   * @param {number} ttlSeconds - Time to live in seconds (default: 300s/5min)
   * @returns {boolean} Success status
   */
  async set(key, value, ttlSeconds = 300) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('⚠️  Cache set error:', error.message);
      return false;
    }
  }

  /**
   * @method del
   * @async
   * @description Deletes a value from cache by key
   * @param {string} key - Cache key to delete
   * @returns {boolean} Success status
   */
  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.warn('⚠️  Cache delete error:', error.message);
      return false;
    }
  }

  /**
   * @method flush
   * @async
   * @description Clears all cached data
   * @returns {boolean} Success status
   */
  async flush() {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.warn('⚠️  Cache flush error:', error.message);
      return false;
    }
  }

  /**
   * @method generateKey
   * @description Creates a deterministic cache key from a prefix and parameters
   * @param {string} prefix - Base key prefix (typically an API endpoint path)
   * @param {Object} params - Query parameters to include in the key
   * @returns {string} Formatted cache key
   */
  generateKey(prefix, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return paramString ? `${prefix}:${paramString}` : prefix;
  }
}

/**
 * @constant {CacheService} cacheService
 * @description Singleton instance of the cache service for application-wide use
 */
const cacheService = new CacheService();

/**
 * @function cacheMiddleware
 * @description Express middleware that automatically caches GET responses
 * @param {number} ttlSeconds - Cache time-to-live in seconds (default: 300s/5min)
 * @returns {Function} Express middleware function
 */
export const cacheMiddleware = (ttlSeconds = 300) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key based on URL and query parameters
    const cacheKey = cacheService.generateKey(
      `api:${req.path}`,
      req.query
    );

    try {
      // Try to get cached response
      const cachedResponse = await cacheService.get(cacheKey);
      
      if (cachedResponse) {
        console.log(`🎯 Cache hit for: ${cacheKey}`);
        return res.json(cachedResponse);
      }

      // If no cache, continue to next middleware
      console.log(`🔍 Cache miss for: ${cacheKey}`);
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, ttlSeconds)
            .then(() => console.log(`💾 Cached response for: ${cacheKey}`))
            .catch(err => console.warn(`⚠️  Failed to cache: ${err.message}`));
        }
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.warn('⚠️  Cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * @function invalidateCache
 * @description Middleware that invalidates cache entries after successful operations
 * @param {Array<string>} patterns - Cache key patterns to invalidate (not currently used)
 * @returns {Function} Express middleware function
 */
export const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    // Store original response methods
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override response methods to invalidate cache after successful operations
    const invalidatePatterns = async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patterns) {
          try {
            // For simplicity, we'll flush all cache
            // In production, implement pattern-based invalidation
            await cacheService.flush();
            console.log(`🗑️  Cache invalidated for pattern: ${pattern}`);
          } catch (error) {
            console.warn(`⚠️  Cache invalidation failed: ${error.message}`);
          }
        }
      }
    };

    res.json = function(data) {
      invalidatePatterns();
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      invalidatePatterns();
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Default export of the singleton cache service instance
 * @exports cacheService
 */
export default cacheService;
