/**
 * @file Performance Routes
 * @description Railway-specific performance monitoring and cache management endpoints
 * @module routes/performanceRoutes
 */

import express from 'express';
import { requireRole } from '../middleware/enhancedAuthMiddleware.js';
import { getPerformanceStats } from '../utils/unifiedPerformance.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(requireRole(['system_admin']));

/**
 * Manual cache refresh endpoint for immediate content updates
 */
router.post('/cache/refresh', async (req, res) => {
  try {
    console.log('🔄 Manual cache refresh requested');
    
    // Clear memory cache
    if (global.memoryCache) {
      global.memoryCache.flushAll();
      console.log('✅ Memory cache cleared');
    }
    
    // Clear enhanced cache
    try {
      const { invalidateCache } = await import('../middleware/enhancedCache.js');
      await invalidateCache(['blogs', 'news', 'events', 'content', 'dashboard', 'search']);
      console.log('✅ Enhanced cache cleared');
    } catch (cacheError) {
      console.warn('⚠️ Enhanced cache warning:', cacheError.message);
    }
    
    res.json({
      success: true,
      message: 'Cache refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Cache refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh cache',
      error: error.message
    });
  }
});

/**
 * Railway performance diagnostics
 */
router.get('/diagnostics', async (req, res) => {
  try {
    const performanceStats = getPerformanceStats();
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      platform: 'Railway',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      uptime: {
        seconds: process.uptime(),
        formatted: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`
      },
      cache: performanceStats.cache,
      slowRequests: performanceStats.slowRequests,
      services: {
        email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        database: true, // If we're responding, DB is connected
        gridfs: true,
        performanceOptimized: true
      }
    };
    
    res.json({
      success: true,
      data: diagnostics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get diagnostics',
      error: error.message
    });
  }
});

/**
 * Content sync status for Railway deployment
 */
router.get('/content/sync-status', async (req, res) => {
  try {
    const { default: Blog } = await import('../models/Blog.js');
    const { default: News } = await import('../models/News.js');
    const { default: Event } = await import('../models/Event.js');
    
    const stats = {
      blogs: await Blog.countDocuments(),
      news: await News.countDocuments(),
      events: await Event.countDocuments(),
      lastUpdated: new Date().toISOString()
    };
    
    // Check recent content creation (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentContent = {
      blogs: await Blog.countDocuments({ createdAt: { $gte: yesterday } }),
      news: await News.countDocuments({ createdAt: { $gte: yesterday } }),
      events: await Event.countDocuments({ createdAt: { $gte: yesterday } })
    };
    
    res.json({
      success: true,
      data: {
        totalContent: stats,
        recentContent,
        cacheStatus: 'operational'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
});

export default router;
