/**
 * Redis caching middleware for performance optimization
 */

import redis from 'redis';

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.initializeClient();
  }

  async initializeClient() {
    try {
      // Create Redis client with fallback configuration
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
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

  generateKey(prefix, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return paramString ? `${prefix}:${paramString}` : prefix;
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Middleware function for caching API responses
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

// Cache invalidation middleware
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

export default cacheService;
