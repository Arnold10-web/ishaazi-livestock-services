/**
 * @file Performance Optimization Utilities
 * @description Collection of utilities to optimize application performance
 * @module utils/performanceOptimizer
 */

import { performance } from 'perf_hooks';
import os from 'os';

/**
 * Memory usage monitoring
 * @returns {Object} Memory usage statistics
 */
export const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  const systemMemory = {
    total: os.totalmem(),
    free: os.freemem(),
    used: os.totalmem() - os.freemem()
  };
  
  return {
    process: {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024) // MB
    },
    system: {
      total: Math.round(systemMemory.total / 1024 / 1024), // MB
      free: Math.round(systemMemory.free / 1024 / 1024), // MB
      used: Math.round(systemMemory.used / 1024 / 1024), // MB
      usagePercent: Math.round((systemMemory.used / systemMemory.total) * 100)
    }
  };
};

/**
 * CPU usage monitoring
 * @returns {Object} CPU usage statistics
 */
export const getCPUUsage = () => {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  
  return {
    cores: cpus.length,
    model: cpus[0]?.model || 'Unknown',
    loadAverage: {
      '1min': Math.round(loadAvg[0] * 100) / 100,
      '5min': Math.round(loadAvg[1] * 100) / 100,
      '15min': Math.round(loadAvg[2] * 100) / 100
    },
    usage: Math.round((loadAvg[0] / cpus.length) * 100)
  };
};

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  constructor(label) {
    this.label = label;
    this.startTime = performance.now();
  }
  
  /**
   * End timer and return duration
   * @returns {number} Duration in milliseconds
   */
  end() {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${this.label}: ${Math.round(duration * 100) / 100}ms`);
    }
    
    return duration;
  }
}

/**
 * Database query optimization helper
 * @param {Function} queryFn - Async function that performs the database query
 * @param {string} label - Label for performance tracking
 * @returns {Promise} Query result with performance tracking
 */
export const optimizedQuery = async (queryFn, label = 'Database Query') => {
  const timer = new PerformanceTimer(label);
  
  try {
    const result = await queryFn();
    timer.end();
    return result;
  } catch (error) {
    timer.end();
    throw error;
  }
};

/**
 * Batch processing utility for large datasets
 * @param {Array} items - Items to process
 * @param {Function} processor - Function to process each batch
 * @param {number} batchSize - Size of each batch
 * @returns {Promise<Array>} Results from all batches
 */
export const batchProcess = async (items, processor, batchSize = 100) => {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResult = await processor(batch);
    results.push(...batchResult);
    
    // Allow event loop to process other tasks
    if (i + batchSize < items.length) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
  
  return results;
};

/**
 * Memory-efficient JSON response helper
 * @param {Object} res - Express response object
 * @param {Object} data - Data to send
 * @param {number} statusCode - HTTP status code
 */
export const sendOptimizedResponse = (res, data, statusCode = 200) => {
  // Set appropriate headers for caching and compression
  res.set({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  // Use streaming for large responses
  if (JSON.stringify(data).length > 100000) { // > 100KB
    res.status(statusCode);
    res.write(JSON.stringify(data));
    res.end();
  } else {
    res.status(statusCode).json(data);
  }
};

/**
 * Resource cleanup utility
 */
export const cleanupResources = () => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Log current memory usage
  const memory = getMemoryUsage();
  console.log(`🧹 Cleanup - Memory usage: ${memory.process.heapUsed}MB heap, ${memory.process.rss}MB RSS`);
};

/**
 * Performance monitoring middleware
 * @param {string} label - Label for the operation being monitored
 * @returns {Function} Express middleware function
 */
export const performanceMiddleware = (label) => {
  return (req, res, next) => {
    const timer = new PerformanceTimer(`${label} - ${req.method} ${req.path}`);
    
    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(...args) {
      timer.end();
      originalEnd.apply(this, args);
    };
    
    next();
  };
};

export default {
  getMemoryUsage,
  getCPUUsage,
  PerformanceTimer,
  optimizedQuery,
  batchProcess,
  sendOptimizedResponse,
  cleanupResources,
  performanceMiddleware
};
