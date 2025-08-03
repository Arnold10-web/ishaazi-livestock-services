/**
 * @file Unified Performance Optimization
 * @description Combines Railway-specific performance fixes with general optimizations
 * @module utils/unifiedPerformance
 */

import mongoose from 'mongoose';
import NodeCache from 'node-cache';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize performance cache
const performanceCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false // Better performance, but be careful with object mutations
});

/**
 * Railway-optimized file serving with enhanced performance
 * Combines GridFS optimization with Railway-specific features
 */
export const enhancedFileServing = () => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid file ID format' });
      }
      
      // Check cache first (Railway optimization)
      const cacheKey = `file_${id}`;
      const cachedFile = performanceCache.get(cacheKey);
      
      if (cachedFile && cachedFile.data) {
        console.log(`⚡ Serving cached file: ${id} (${Date.now() - startTime}ms)`);
        res.set({
          'Content-Type': cachedFile.contentType,
          'Content-Length': cachedFile.length,
          'Cache-Control': 'public, max-age=31536000', // 1 year for Railway CDN
          'ETag': `"${id}"`,
          'X-Cache': 'HIT'
        });
        return res.send(cachedFile.data);
      }
      
      // Connect to GridFS
      if (!mongoose.connection.db) {
        throw new Error('Database connection not available');
      }
      
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db);
      
      // Find file metadata
      const fileDoc = await bucket.find({ _id: new mongoose.Types.ObjectId(id) }).next();
      
      if (!fileDoc) {
        console.log(`❌ File not found: ${id} (${Date.now() - startTime}ms)`);
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Handle conditional requests (Railway CDN optimization)
      const etag = `"${fileDoc._id}"`;
      const lastModified = fileDoc.uploadDate.toUTCString();
      
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
      
      // Set response headers for Railway CDN
      res.set({
        'Content-Type': fileDoc.contentType || 'application/octet-stream',
        'Content-Length': fileDoc.length,
        'ETag': etag,
        'Last-Modified': lastModified,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000', // 1 year
        'X-Cache': 'MISS'
      });
      
      // Handle range requests for better performance
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileDoc.length - 1;
        const chunksize = (end - start) + 1;
        
        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${fileDoc.length}`,
          'Content-Length': chunksize
        });
        
        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(id), {
          start,
          end: end + 1
        });
        
        downloadStream.pipe(res);
      } else {
        // Full file download with caching for small files
        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(id));
        
        // Cache small files (< 1MB) for Railway optimization
        if (fileDoc.length < 1024 * 1024) {
          const chunks = [];
          
          downloadStream.on('data', chunk => chunks.push(chunk));
          downloadStream.on('end', () => {
            const fileData = Buffer.concat(chunks);
            
            // Cache for future requests
            performanceCache.set(cacheKey, {
              data: fileData,
              contentType: fileDoc.contentType,
              length: fileDoc.length
            }, 3600); // Cache for 1 hour
            
            console.log(`✅ File served and cached: ${id} (${Date.now() - startTime}ms)`);
          });
          
          downloadStream.pipe(res);
        } else {
          // Stream large files directly
          downloadStream.pipe(res);
          console.log(`✅ Large file streamed: ${id} (${Date.now() - startTime}ms)`);
        }
      }
      
      downloadStream.on('error', (error) => {
        console.error(`❌ File serving error for ${id}:`, error.message);
        if (!res.headersSent) {
          res.status(500).json({ error: 'File serving error' });
        }
      });
      
    } catch (error) {
      console.error(`❌ Enhanced file serving error:`, error.message);
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 5000) {
        console.warn(`⚠️ Slow file request: ${responseTime}ms for file ${req.params.id}`);
      }
      
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
};

/**
 * Force content refresh middleware for immediate cache invalidation
 * Railway-optimized for instant content updates
 */
export const forceContentRefresh = () => {
  return async (req, res, next) => {
    try {
      // Clear all relevant caches immediately
      console.log('🔄 Forcing content refresh...');
      
      // Clear performance cache
      performanceCache.flushAll();
      
      // Clear global memory cache if available
      if (global.memoryCache) {
        global.memoryCache.flushAll();
      }
      
      // Clear enhanced cache
      try {
        const { invalidateCache } = await import('../middleware/enhancedCache.js');
        await invalidateCache(['blogs', 'news', 'events', 'content', 'dashboard', 'search']);
      } catch (cacheError) {
        console.warn('⚠️ Enhanced cache warning:', cacheError.message);
      }
      
      // Set no-cache headers for immediate updates
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Refresh': 'forced'
      });
      
      console.log('✅ Content refresh completed');
      next();
      
    } catch (error) {
      console.error('❌ Content refresh error:', error.message);
      next(); // Continue even if refresh fails
    }
  };
};

/**
 * Performance monitoring middleware for Railway optimization
 */
export const performanceMonitor = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Monitor response time
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      if (responseTime > threshold) {
        console.warn(`⚠️ Slow request: ${req.method} ${req.originalUrl} - ${responseTime}ms`);
        
        // Log to performance cache for monitoring
        const slowRequestKey = `slow_${Date.now()}`;
        performanceCache.set(slowRequestKey, {
          method: req.method,
          url: req.originalUrl,
          responseTime,
          timestamp: new Date().toISOString(),
          userAgent: req.get('User-Agent'),
          ip: req.ip
        }, 3600); // Keep for 1 hour
      }
    });
    
    next();
  };
};

/**
 * Database query optimization for Railway
 */
export const optimizeQuery = (query) => {
  return query
    .lean() // Return plain objects for better performance
    .maxTimeMS(5000) // 5 second timeout for Railway
    .hint({ _id: 1 }); // Use _id index when possible
};

/**
 * Optimized pagination for Railway environment
 */
export const optimizedPagination = async (Model, page = 1, limit = 20, filter = {}, sort = { createdAt: -1 }) => {
  const startTime = Date.now();
  
  try {
    // Optimize limit for Railway (max 50 items)
    const optimizedLimit = Math.min(limit, 50);
    const skip = (page - 1) * optimizedLimit;
    
    // Use aggregation for better performance on large datasets
    const pipeline = [
      { $match: filter },
      { $sort: sort },
      { $facet: {
        data: [
          { $skip: skip },
          { $limit: optimizedLimit }
        ],
        totalCount: [
          { $count: "count" }
        ]
      }}
    ];
    
    const [result] = await Model.aggregate(pipeline).maxTimeMS(5000);
    const items = result.data || [];
    const total = result.totalCount[0]?.count || 0;
    
    const responseTime = Date.now() - startTime;
    if (responseTime > 1000) {
      console.warn(`⚠️ Slow pagination query: ${responseTime}ms`);
    }
    
    return {
      items,
      pagination: {
        page: parseInt(page),
        limit: optimizedLimit,
        total,
        pages: Math.ceil(total / optimizedLimit),
        hasNext: skip + optimizedLimit < total,
        hasPrev: page > 1
      },
      performance: {
        queryTime: responseTime,
        itemCount: items.length
      }
    };
    
  } catch (error) {
    console.error('❌ Pagination error:', error.message);
    throw error;
  }
};

/**
 * File validation and cleanup utilities
 */
export const validateFileExists = async (fileId) => {
  if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
    return false;
  }
  
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db);
    const fileDoc = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).next();
    return !!fileDoc;
  } catch (error) {
    console.error('File validation error:', error.message);
    return false;
  }
};

export const cleanupOrphanedFiles = async () => {
  try {
    console.log('🧹 Starting orphaned file cleanup...');
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db);
    
    // This is a placeholder - implement based on your specific models
    // Find files not referenced by any content
    const orphanedFiles = await bucket.find({
      uploadDate: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
    }).toArray();
    
    console.log(`Found ${orphanedFiles.length} potentially orphaned files`);
    // Implement cleanup logic based on your requirements
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
};

/**
 * Get performance statistics
 */
export const getPerformanceStats = () => {
  const stats = performanceCache.getStats();
  const slowRequests = [];
  
  // Get recent slow requests
  const keys = performanceCache.keys();
  keys.forEach(key => {
    if (key.startsWith('slow_')) {
      const slowRequest = performanceCache.get(key);
      if (slowRequest) {
        slowRequests.push(slowRequest);
      }
    }
  });
  
  return {
    cache: {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) * 100 || 0
    },
    slowRequests: slowRequests.slice(-10), // Last 10 slow requests
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    uptime: process.uptime()
  };
};

export default {
  enhancedFileServing,
  forceContentRefresh,
  performanceMonitor,
  optimizeQuery,
  optimizedPagination,
  validateFileExists,
  cleanupOrphanedFiles,
  getPerformanceStats
};
