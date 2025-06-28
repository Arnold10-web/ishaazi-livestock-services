// Enhanced Redis caching for production
import Redis from 'ioredis';

class ProductionCache {
  constructor() {
    this.redis = null;
    this.memoryCache = new Map();
    this.isRedisAvailable = false;
    this.maxMemorySize = 100; // Max items in memory cache
    this.defaultTTL = 300; // 5 minutes default TTL
    
    this.initialize();
  }

  async initialize() {
    try {
      // Try to connect to Redis if available
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true
        });
        
        await this.redis.ping();
        this.isRedisAvailable = true;
        console.log('✅ Redis cache connected');
      } else {
        console.log('⚠️ Redis not available, using memory cache');
      }
    } catch (error) {
      console.log('⚠️ Redis connection failed, falling back to memory cache');
      this.isRedisAvailable = false;
    }
  }

  // Smart caching strategy
  async get(key) {
    try {
      if (this.isRedisAvailable) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return this.memoryCache.get(key) || null;
      }
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (this.isRedisAvailable) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      } else {
        // Memory cache with LRU eviction
        if (this.memoryCache.size >= this.maxMemorySize) {
          const firstKey = this.memoryCache.keys().next().value;
          this.memoryCache.delete(firstKey);
        }
        
        this.memoryCache.set(key, value);
        
        // Set expiration for memory cache
        setTimeout(() => {
          this.memoryCache.delete(key);
        }, ttl * 1000);
      }
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      if (this.isRedisAvailable) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  // Pattern-based cache invalidation
  async invalidatePattern(pattern) {
    try {
      if (this.isRedisAvailable) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // Simple pattern matching for memory cache
        const keysToDelete = [];
        for (const key of this.memoryCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.memoryCache.delete(key));
      }
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  // Cache warming for frequently accessed data
  async warmCache() {
    console.log('🔥 Warming cache with frequently accessed data...');
    
    try {
      // Import models dynamically to avoid circular dependencies
      const { default: Blog } = await import('../models/Blog.js');
      const { default: News } = await import('../models/News.js');
      
      // Cache popular content
      const [popularBlogs, recentNews] = await Promise.all([
        Blog.find({ published: true }).sort({ views: -1 }).limit(10).lean(),
        News.find({ published: true }).sort({ createdAt: -1 }).limit(10).lean()
      ]);
      
      await this.set('popular_blogs', popularBlogs, 600); // 10 minutes
      await this.set('recent_news', recentNews, 300); // 5 minutes
      
      console.log('✅ Cache warmed successfully');
    } catch (error) {
      console.warn('Cache warming error:', error);
    }
  }
}

// Enhanced caching middleware
const createCacheMiddleware = (cache) => {
  return (ttl = 300, keyGenerator = null) => {
    return async (req, res, next) => {
      // Skip caching for authenticated requests or POST/PUT/DELETE
      if (req.method !== 'GET' || req.headers.authorization) {
        return next();
      }

      // Generate cache key
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : `${req.originalUrl}_${JSON.stringify(req.query)}`;

      try {
        // Try to get from cache
        const cached = await cache.get(cacheKey);
        if (cached) {
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-Key', cacheKey);
          return res.json(cached);
        }

        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function(data) {
          // Only cache successful responses
          if (res.statusCode === 200) {
            cache.set(cacheKey, data, ttl).catch(err => 
              console.warn('Cache set error:', err)
            );
          }
          
          res.setHeader('X-Cache', 'MISS');
          res.setHeader('X-Cache-Key', cacheKey);
          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        console.warn('Cache middleware error:', error);
        next();
      }
    };
  };
};

// Cache invalidation utilities
const createCacheInvalidator = (cache) => {
  return {
    invalidateContent: (contentType) => {
      return cache.invalidatePattern(`*${contentType}*`);
    },
    
    invalidateUser: (userId) => {
      return cache.invalidatePattern(`*user_${userId}*`);
    },
    
    invalidateAll: () => {
      if (cache.isRedisAvailable) {
        return cache.redis.flushdb();
      } else {
        cache.memoryCache.clear();
      }
    }
  };
};

export { ProductionCache, createCacheMiddleware, createCacheInvalidator };
