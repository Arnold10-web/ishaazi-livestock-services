/**
 * Performance monitoring middleware for search operations
 * Tracks response times, error rates, and resource usage
 */

import { performance } from 'perf_hooks';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      searchRequests: 0,
      totalResponseTime: 0,
      errors: 0,
      slowQueries: 0,
      responseTimeHistogram: {
        '<100ms': 0,
        '100-500ms': 0,
        '500-1000ms': 0,
        '1000-2000ms': 0,
        '>2000ms': 0
      }
    };
  }

  recordRequest(responseTime, isError = false) {
    this.metrics.searchRequests++;
    this.metrics.totalResponseTime += responseTime;
    
    if (isError) {
      this.metrics.errors++;
    }
    
    if (responseTime > 1000) {
      this.metrics.slowQueries++;
    }
    
    // Update histogram
    if (responseTime < 100) {
      this.metrics.responseTimeHistogram['<100ms']++;
    } else if (responseTime < 500) {
      this.metrics.responseTimeHistogram['100-500ms']++;
    } else if (responseTime < 1000) {
      this.metrics.responseTimeHistogram['500-1000ms']++;
    } else if (responseTime < 2000) {
      this.metrics.responseTimeHistogram['1000-2000ms']++;
    } else {
      this.metrics.responseTimeHistogram['>2000ms']++;
    }
  }

  getAverageResponseTime() {
    return this.metrics.searchRequests > 0 
      ? this.metrics.totalResponseTime / this.metrics.searchRequests 
      : 0;
  }

  getErrorRate() {
    return this.metrics.searchRequests > 0 
      ? (this.metrics.errors / this.metrics.searchRequests) * 100 
      : 0;
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      slowQueryRate: this.metrics.searchRequests > 0 
        ? (this.metrics.slowQueries / this.metrics.searchRequests) * 100 
        : 0
    };
  }

  reset() {
    this.metrics = {
      searchRequests: 0,
      totalResponseTime: 0,
      errors: 0,
      slowQueries: 0,
      responseTimeHistogram: {
        '<100ms': 0,
        '100-500ms': 0,
        '500-1000ms': 0,
        '1000-2000ms': 0,
        '>2000ms': 0
      }
    };
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware to track search performance
 */
export const searchPerformanceMiddleware = (req, res, next) => {
  const startTime = performance.now();
  
  // Override res.json to capture response time
  const originalJson = res.json;
  res.json = function(data) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    const isError = res.statusCode >= 400;
    
    // Record metrics
    performanceMonitor.recordRequest(responseTime, isError);
    
    // Log slow queries
    if (responseTime > 1000) {
      console.warn(`🐌 Slow search query detected:`, {
        url: req.url,
        method: req.method,
        responseTime: Math.round(responseTime),
        query: req.query,
        statusCode: res.statusCode
      });
    }
    
    // Log performance info
    console.log(`⚡ Search Performance:`, {
      url: req.url,
      responseTime: Math.round(responseTime) + 'ms',
      statusCode: res.statusCode,
      query: req.query?.query || 'N/A'
    });
    
    // Add performance headers
    res.set('X-Response-Time', Math.round(responseTime) + 'ms');
    res.set('X-Search-Performance', JSON.stringify({
      responseTime: Math.round(responseTime),
      avgResponseTime: Math.round(performanceMonitor.getAverageResponseTime()),
      errorRate: Math.round(performanceMonitor.getErrorRate() * 100) / 100
    }));
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Get performance metrics endpoint
 */
export const getPerformanceMetrics = (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    
    res.json({
      success: true,
      data: {
        ...metrics,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics'
    });
  }
};

/**
 * Reset performance metrics endpoint
 */
export const resetPerformanceMetrics = (req, res) => {
  try {
    performanceMonitor.reset();
    console.log('📊 Performance metrics reset');
    
    res.json({
      success: true,
      message: 'Performance metrics reset successfully'
    });
  } catch (error) {
    console.error('Error resetting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset performance metrics'
    });
  }
};

export default performanceMonitor;
