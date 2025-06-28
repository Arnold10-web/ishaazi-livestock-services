/**
 * @file Performance Metrics Middleware
 * @description Enhanced performance monitoring for production optimization
 * @module middleware/performanceMetrics
 */

import { performance } from 'perf_hooks';

/**
 * Performance metrics storage
 */
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    avgResponseTime: 0,
    routes: new Map()
  },
  memory: {
    usage: process.memoryUsage(),
    lastUpdated: Date.now()
  },
  database: {
    queries: 0,
    slowQueries: 0,
    avgQueryTime: 0
  }
};

/**
 * Update memory metrics periodically
 */
setInterval(() => {
  metrics.memory.usage = process.memoryUsage();
  metrics.memory.lastUpdated = Date.now();
}, 30000); // Update every 30 seconds

/**
 * Performance monitoring middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const performanceMonitor = (req, res, next) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  
  // Track request start
  metrics.requests.total++;
  
  // Override res.end to capture response metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Update metrics
    updateRouteMetrics(req.route?.path || req.path, responseTime, res.statusCode);
    updateAverageResponseTime(responseTime);
    
    // Track success/error
    if (res.statusCode >= 200 && res.statusCode < 400) {
      metrics.requests.success++;
    } else {
      metrics.requests.errors++;
    }
    
    // Log slow requests (>1000ms)
    if (responseTime > 1000) {
      console.warn(`🐌 Slow request detected: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
    }
    
    // Set performance headers
    res.set({
      'X-Response-Time': `${responseTime.toFixed(2)}ms`,
      'X-Memory-Usage': `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    });
    
    originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Update route-specific metrics
 */
function updateRouteMetrics(route, responseTime, statusCode) {
  if (!metrics.requests.routes.has(route)) {
    metrics.requests.routes.set(route, {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      errors: 0
    });
  }
  
  const routeMetrics = metrics.requests.routes.get(route);
  routeMetrics.count++;
  routeMetrics.totalTime += responseTime;
  routeMetrics.avgTime = routeMetrics.totalTime / routeMetrics.count;
  
  if (statusCode >= 400) {
    routeMetrics.errors++;
  }
}

/**
 * Update average response time
 */
function updateAverageResponseTime(responseTime) {
  const total = metrics.requests.total;
  const currentAvg = metrics.requests.avgResponseTime;
  metrics.requests.avgResponseTime = ((currentAvg * (total - 1)) + responseTime) / total;
}

/**
 * Database query performance tracker
 */
export const trackDatabaseQuery = (queryTime) => {
  metrics.database.queries++;
  
  if (queryTime > 500) { // Slow query threshold: 500ms
    metrics.database.slowQueries++;
    console.warn(`🐌 Slow database query detected: ${queryTime.toFixed(2)}ms`);
  }
  
  // Update average query time
  const total = metrics.database.queries;
  const currentAvg = metrics.database.avgQueryTime;
  metrics.database.avgQueryTime = ((currentAvg * (total - 1)) + queryTime) / total;
};

/**
 * Get current performance metrics
 */
export const getMetrics = () => ({
  ...metrics,
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
  routes: Object.fromEntries(metrics.requests.routes)
});

/**
 * Reset metrics (useful for testing)
 */
export const resetMetrics = () => {
  metrics.requests.total = 0;
  metrics.requests.success = 0;
  metrics.requests.errors = 0;
  metrics.requests.avgResponseTime = 0;
  metrics.requests.routes.clear();
  metrics.database.queries = 0;
  metrics.database.slowQueries = 0;
  metrics.database.avgQueryTime = 0;
};

/**
 * Middleware to add cache headers for static assets
 */
export const staticCacheHeaders = (req, res, next) => {
  // Cache static assets for different durations
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // Cache static assets for 1 year
    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': req.get('If-None-Match') || `"${Date.now()}"`,
      'Last-Modified': new Date().toUTCString()
    });
  } else if (req.path.match(/\.(html|json)$/)) {
    // Cache HTML and JSON for 1 hour with revalidation
    res.set({
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'ETag': `"${Date.now()}"`,
      'Last-Modified': new Date().toUTCString()
    });
  } else if (req.path.startsWith('/api/')) {
    // API responses - cache for 5 minutes but allow stale content
    res.set({
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'Vary': 'Accept-Encoding, Authorization'
    });
  }
  
  next();
};

export default { performanceMonitor, trackDatabaseQuery, getMetrics, resetMetrics, staticCacheHeaders };
