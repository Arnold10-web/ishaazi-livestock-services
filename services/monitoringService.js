/**
 * Monitoring Service
 * 
 * This service provides comprehensive application monitoring, logging, and performance
 * tracking capabilities. It centralizes all application logging, error tracking,
 * and performance metrics collection into a unified monitoring system.
 * 
 * Features:
 * - Structured logging with different log levels
 * - Performance metrics collection
 * - Request timing and tracking
 * - Error aggregation and classification
 * - System health monitoring
 * - Configurable log rotation and retention
 * 
 * @module services/monitoringService
 */
import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Create __dirname equivalent for ES modules
 * Necessary because ES modules don't have __dirname available by default
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensure logs directory exists
 * Creates the directory if it doesn't exist to prevent write errors
 */
const logsDir = path.join(__dirname, '../logs');
fs.mkdirSync(logsDir, { recursive: true });

/**
 * Custom log formatter that combines timestamp, error stacks, and JSON metadata
 * Creates a consistent, structured log format for better parsing and analysis
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

/**
 * Main logger instance
 * Configured with multiple transports for different log levels and retention policies
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'farming-magazine' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      handleExceptions: true,
      handleRejections: true
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    
    // Daily rotating file
    new winston.transports.File({
      filename: path.join(logsDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ],
  exitOnError: false
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Performance monitoring class
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      memoryUsage: [],
      cpuUsage: [],
      activeConnections: 0
    };
    
    this.startTime = Date.now();
    this.collectSystemMetrics();
  }

  // Middleware for request monitoring
  requestMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      this.metrics.requests++;
      
      // Log request
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      // Monitor response
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        this.metrics.responseTime.push(responseTime);
        
        // Keep only last 1000 response times
        if (this.metrics.responseTime.length > 1000) {
          this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
        }

        // Log response
        const logLevel = res.statusCode >= 400 ? 'error' : 'info';
        logger[logLevel]('HTTP Response', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        });

        // Count errors
        if (res.statusCode >= 400) {
          this.metrics.errors++;
        }
      });

      next();
    };
  }

  // Collect system metrics
  collectSystemMetrics() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      });

      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
      }

      // Log high memory usage
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;
      if (memUsageMB > 500) { // Alert if using more than 500MB
        logger.warn('High memory usage detected', {
          heapUsed: `${memUsageMB.toFixed(2)}MB`,
          heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`
        });
      }
    }, 30000); // Every 30 seconds
  }

  // Get current metrics
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length 
      : 0;

    const memUsage = process.memoryUsage();
    
    return {
      uptime: Math.floor(uptime / 1000), // in seconds
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%' : '0%',
      averageResponseTime: Math.round(avgResponseTime),
      memoryUsage: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
      },
      activeConnections: this.metrics.activeConnections
    };
  }

  // Set active connections count
  setActiveConnections(count) {
    this.metrics.activeConnections = count;
  }

  // Log error with context
  logError(error, context = {}) {
    logger.error(error.message || error, {
      stack: error.stack,
      ...context
    });
  }

  // Log application events
  logEvent(event, data = {}) {
    logger.info(`Application Event: ${event}`, data);
  }
}

// Application health checker
class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.status = 'healthy';
  }

  // Register a health check
  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  // Run all health checks
  async runChecks() {
    const results = {};
    let overall = 'healthy';

    for (const [name, checkFn] of this.checks) {
      try {
        const result = await checkFn();
        results[name] = {
          status: result.status || 'healthy',
          message: result.message || 'OK',
          timestamp: new Date().toISOString()
        };

        if (result.status === 'unhealthy') {
          overall = 'unhealthy';
        }
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          message: error.message,
          timestamp: new Date().toISOString()
        };
        overall = 'unhealthy';
      }
    }

    this.status = overall;
    return {
      status: overall,
      checks: results,
      timestamp: new Date().toISOString()
    };
  }

  // Get health status
  getStatus() {
    return this.status;
  }
}

// Error tracking and alerting
class ErrorTracker {
  constructor() {
    this.errorCounts = new Map();
    this.alertThresholds = {
      errorRate: 10, // 10% error rate
      errorCount: 100, // 100 errors per hour
      memoryUsage: 80 // 80% memory usage
    };
  }

  // Track error
  trackError(error, context = {}) {
    const errorKey = error.message || error.toString();
    const current = this.errorCounts.get(errorKey) || { count: 0, lastSeen: null };
    
    current.count++;
    current.lastSeen = new Date();
    this.errorCounts.set(errorKey, current);

    // Log error
    logger.error('Error tracked', {
      error: errorKey,
      count: current.count,
      context
    });

    // Check if alert should be sent
    this.checkAlerts(errorKey, current);
  }

  // Check if alerts should be triggered
  checkAlerts(errorKey, errorData) {
    if (errorData.count >= this.alertThresholds.errorCount) {
      this.sendAlert('high_error_count', {
        error: errorKey,
        count: errorData.count,
        threshold: this.alertThresholds.errorCount
      });
    }
  }

  // Send alert (placeholder - integrate with your alerting system)
  sendAlert(type, data) {
    logger.error(`ALERT: ${type}`, data);
    
    // Here you would integrate with:
    // - Email notifications
    // - Slack webhooks
    // - PagerDuty
    // - SMS alerts
    // etc.
  }

  // Get error statistics
  getErrorStats() {
    const stats = {};
    for (const [error, data] of this.errorCounts) {
      stats[error] = {
        count: data.count,
        lastSeen: data.lastSeen
      };
    }
    return stats;
  }

  // Clear old errors (run this periodically)
  cleanupOldErrors() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [error, data] of this.errorCounts) {
      if (data.lastSeen < oneDayAgo) {
        this.errorCounts.delete(error);
      }
    }
  }
}

// Application monitoring setup
const setupMonitoring = (app) => {
  const performanceMonitor = new PerformanceMonitor();
  const healthChecker = new HealthChecker();
  const errorTracker = new ErrorTracker();

  // Add performance monitoring middleware
  app.use(performanceMonitor.requestMiddleware());

  // Register health checks
  healthChecker.registerCheck('database', async () => {
    // Add your database connection check here
    return { status: 'healthy', message: 'Database connected' };
  });

  healthChecker.registerCheck('memory', async () => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 1000) { // More than 1GB
      return { status: 'warning', message: `High memory usage: ${heapUsedMB.toFixed(2)}MB` };
    }
    
    return { status: 'healthy', message: `Memory usage: ${heapUsedMB.toFixed(2)}MB` };
  });

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    const health = await healthChecker.runChecks();
    const status = health.status === 'healthy' ? 200 : 503;
    res.status(status).json(health);
  });

  // Metrics endpoint
  app.get('/api/metrics', (req, res) => {
    res.json({
      performance: performanceMonitor.getMetrics(),
      errors: errorTracker.getErrorStats(),
      timestamp: new Date().toISOString()
    });
  });

  // Global error handler
  app.use((error, req, res, next) => {
    errorTracker.trackError(error, {
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    
    logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    });

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  });

  // Process error handlers
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    errorTracker.trackError(error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    errorTracker.trackError(new Error(reason));
  });

  // Cleanup interval
  setInterval(() => {
    errorTracker.cleanupOldErrors();
  }, 60 * 60 * 1000); // Every hour

  return {
    logger,
    performanceMonitor,
    healthChecker,
    errorTracker
  };
};

export {
  logger,
  PerformanceMonitor,
  HealthChecker,
  ErrorTracker,
  setupMonitoring
};
