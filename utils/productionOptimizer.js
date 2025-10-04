/**
 * @file productionOptimizer.js
 * @description Production environment performance optimization and monitoring
 * Automatically runs on server startup - no manual intervention required
 * Works with Railway, Heroku, AWS, and other cloud platforms
 */

import os from 'os';
import { performance } from 'perf_hooks';
import logger from './logger.js';

class ProductionOptimizer {
  constructor() {
    this.startTime = Date.now();
    this.memoryThreshold = 450 * 1024 * 1024; // 450MB threshold for most cloud platforms
    this.isMonitoring = false;
    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      memoryPeak: 0
    };
    
    // Auto-initialize in production
    if (process.env.NODE_ENV === 'production') {
      this.initializeProductionOptimizations();
    }
  }

  /**
   * Initialize production-specific optimizations
   */
  initializeProductionOptimizations() {
    const platform = this.detectPlatform();
    logger.info(`� Production optimizations initializing for ${platform}...`);
    
    // Memory monitoring for cloud platform limits
    this.startMemoryMonitoring();
    
    // Performance metrics collection
    this.startPerformanceMonitoring();
    
    // Graceful shutdown handling
    this.setupGracefulShutdown();
    
    // Environment validation
    this.validateProductionEnvironment();
    
    logger.info('✅ Production optimizations active');
  }

  /**
   * Detect the hosting platform
   */
  detectPlatform() {
    if (process.env.RAILWAY_ENVIRONMENT) return 'Railway';
    if (process.env.HEROKU_APP_NAME) return 'Heroku';
    if (process.env.VERCEL) return 'Vercel';
    if (process.env.NETLIFY) return 'Netlify';
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'AWS Lambda';
    return 'Generic Cloud Platform';
  }

  /**
   * Memory monitoring for cloud platform constraints
   */
  startMemoryMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const usedMB = memUsage.heapUsed / 1024 / 1024;
      
      this.metrics.memoryPeak = Math.max(this.metrics.memoryPeak, usedMB);
      
      // Warning at 80% of typical cloud platform 512MB limit
      if (usedMB > 400) {
        logger.warn(`🚨 High memory usage: ${usedMB.toFixed(2)}MB (Cloud limit: 512MB)`);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
          logger.info('🗑️ Garbage collection triggered');
        }
      }
      
      // Critical at 90% of limit
      if (usedMB > 450) {
        logger.error(`🚨 CRITICAL: Memory usage ${usedMB.toFixed(2)}MB approaching cloud platform limit!`);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Performance monitoring for production
   */
  startPerformanceMonitoring() {
    this.isMonitoring = true;
    
    // Log performance summary every 10 minutes
    setInterval(() => {
      const uptime = (Date.now() - this.startTime) / 1000 / 60; // minutes
      const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      const platform = this.detectPlatform();
      
      logger.info(`📊 ${platform} Performance Summary`, {
        uptime: `${uptime.toFixed(1)}min`,
        memory: `${memUsage.toFixed(1)}MB`,
        requests: this.metrics.requests,
        errors: this.metrics.errors,
        avgResponseTime: `${this.metrics.avgResponseTime.toFixed(0)}ms`
      });
    }, 600000); // Every 10 minutes
  }

  /**
   * Express middleware for request tracking
   */
  trackRequest() {
    return (req, res, next) => {
      const start = performance.now();
      this.metrics.requests++;
      
      res.on('finish', () => {
        const duration = performance.now() - start;
        this.metrics.avgResponseTime = (this.metrics.avgResponseTime + duration) / 2;
        
        if (res.statusCode >= 400) {
          this.metrics.errors++;
        }
        
        // Log slow requests (production optimization)
        if (duration > 2000) { // 2 seconds
          logger.warn(`🐌 Slow request: ${req.method} ${req.path} - ${duration.toFixed(0)}ms`);
        }
      });
      
      next();
    };
  }

  /**
   * Validate production environment setup
   */
  validateProductionEnvironment() {
    const requiredEnvVars = [
      'MONGO_URI',
      'JWT_SECRET',
      'SENDGRID_API_KEY',
      'EMAIL_FROM'
    ];
    
    const missing = requiredEnvVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      logger.error('❌ Missing production environment variables:', missing);
    } else {
      logger.info('✅ Production environment validation passed');
    }
    
    // Log platform-specific info
    const platform = this.detectPlatform();
    logger.info(`🌐 Platform: ${platform}`, {
      platform,
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version
    });
  }

  /**
   * Setup graceful shutdown for production
   */
  setupGracefulShutdown() {
    const gracefulShutdown = (signal) => {
      logger.info(`🛑 ${signal} received, shutting down gracefully...`);
      
      // Log final metrics
      const uptime = (Date.now() - this.startTime) / 1000 / 60;
      const platform = this.detectPlatform();
      logger.info(`📊 Final ${platform} metrics:`, {
        uptime: `${uptime.toFixed(1)}min`,
        totalRequests: this.metrics.requests,
        totalErrors: this.metrics.errors,
        peakMemory: `${this.metrics.memoryPeak.toFixed(1)}MB`
      });
      
      process.exit(0);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    const memUsage = process.memoryUsage();
    const uptime = (Date.now() - this.startTime) / 1000 / 60;
    
    return {
      uptime: `${uptime.toFixed(1)}min`,
      memory: {
        heap: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`,
        total: `${(memUsage.heapTotal / 1024 / 1024).toFixed(1)}MB`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(1)}MB`
      },
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? `${((this.metrics.errors / this.metrics.requests) * 100).toFixed(1)}%` : '0%',
      avgResponseTime: `${this.metrics.avgResponseTime.toFixed(0)}ms`,
      peak: {
        memory: `${this.metrics.memoryPeak.toFixed(1)}MB`
      }
    };
  }
}

// Create singleton instance
const productionOptimizer = new ProductionOptimizer();

export default productionOptimizer;
export { ProductionOptimizer };
