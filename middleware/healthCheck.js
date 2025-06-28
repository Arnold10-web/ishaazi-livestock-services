// Enhanced Health Check System
import mongoose from 'mongoose';
import { performance } from 'perf_hooks';
import logger from '../utils/logger.js';

// Health check cache to avoid overwhelming the system
let healthCache = null;
let lastHealthCheck = null;
const HEALTH_CACHE_TTL = 30000; // 30 seconds

/**
 * Comprehensive system health check
 */
export const getSystemHealth = async () => {
  // Return cached result if still valid
  if (healthCache && lastHealthCheck && (Date.now() - lastHealthCheck) < HEALTH_CACHE_TTL) {
    return healthCache;
  }

  const startTime = performance.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {}
  };

  try {
    // Database connectivity check
    health.checks.database = await checkDatabase();
    
    // Memory usage check
    health.checks.memory = checkMemoryUsage();
    
    // Disk space check (if available)
    health.checks.storage = await checkStorageSpace();
    
    // External dependencies check
    health.checks.dependencies = await checkExternalDependencies();
    
    // Response time check
    const responseTime = Math.round(performance.now() - startTime);
    health.checks.responseTime = {
      status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'warning' : 'unhealthy',
      value: responseTime,
      unit: 'ms',
      threshold: { warning: 100, critical: 500 }
    };

    // Determine overall health status
    const statuses = Object.values(health.checks).map(check => check.status);
    if (statuses.includes('unhealthy')) {
      health.status = 'unhealthy';
    } else if (statuses.includes('warning')) {
      health.status = 'warning';
    }

    // Cache the result
    healthCache = health;
    lastHealthCheck = Date.now();

    // Log health status changes
    if (health.status !== 'healthy') {
      logger.warn(`System health status: ${health.status}`, { health });
    }

    return health;

  } catch (error) {
    logger.error('Health check failed:', error);
    
    const errorHealth = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: error.message,
      checks: {
        system: {
          status: 'unhealthy',
          message: 'Health check system failure',
          error: error.message
        }
      }
    };

    healthCache = errorHealth;
    lastHealthCheck = Date.now();
    
    return errorHealth;
  }
};

/**
 * Check database connectivity and performance
 */
const checkDatabase = async () => {
  try {
    const startTime = performance.now();
    
    // Check connection state
    if (mongoose.connection.readyState !== 1) {
      return {
        status: 'unhealthy',
        message: 'Database not connected',
        readyState: mongoose.connection.readyState
      };
    }

    // Simple query to test responsiveness
    await mongoose.connection.db.admin().ping();
    const responseTime = Math.round(performance.now() - startTime);

    // Check connection pool
    const dbStats = mongoose.connection.db.stats ? await mongoose.connection.db.stats() : null;

    return {
      status: responseTime < 50 ? 'healthy' : responseTime < 200 ? 'warning' : 'unhealthy',
      responseTime: responseTime,
      unit: 'ms',
      connection: {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      },
      stats: dbStats ? {
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        indexSize: dbStats.indexSize
      } : null
    };

  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      message: 'Database health check failed',
      error: error.message
    };
  }
};

/**
 * Check memory usage
 */
const checkMemoryUsage = () => {
  const usage = process.memoryUsage();
  const totalMemory = usage.heapTotal;
  const usedMemory = usage.heapUsed;
  const memoryPercentage = (usedMemory / totalMemory) * 100;

  return {
    status: memoryPercentage < 70 ? 'healthy' : memoryPercentage < 90 ? 'warning' : 'unhealthy',
    usage: {
      heapUsed: Math.round(usedMemory / 1024 / 1024),
      heapTotal: Math.round(totalMemory / 1024 / 1024),
      percentage: Math.round(memoryPercentage),
      unit: 'MB'
    },
    thresholds: {
      warning: 70,
      critical: 90,
      unit: '%'
    }
  };
};

/**
 * Check storage space (basic check)
 */
const checkStorageSpace = async () => {
  try {
    // Basic storage check - in production you might want to use a proper filesystem check
    const stats = await import('fs').then(fs => 
      new Promise((resolve, reject) => {
        fs.statvfs ? fs.statvfs('.', (err, stats) => {
          if (err) reject(err);
          else resolve(stats);
        }) : resolve(null);
      })
    ).catch(() => null);

    if (stats) {
      const freeSpace = stats.bavail * stats.frsize;
      const totalSpace = stats.blocks * stats.frsize;
      const usedPercentage = ((totalSpace - freeSpace) / totalSpace) * 100;

      return {
        status: usedPercentage < 80 ? 'healthy' : usedPercentage < 95 ? 'warning' : 'unhealthy',
        usage: {
          free: Math.round(freeSpace / 1024 / 1024 / 1024),
          total: Math.round(totalSpace / 1024 / 1024 / 1024),
          used: Math.round(usedPercentage),
          unit: 'GB'
        }
      };
    }

    return {
      status: 'healthy',
      message: 'Storage check not available on this platform'
    };

  } catch (error) {
    return {
      status: 'warning',
      message: 'Could not check storage space',
      error: error.message
    };
  }
};

/**
 * Check external dependencies
 */
const checkExternalDependencies = async () => {
  const dependencies = [];

  // Add checks for external services you depend on
  // Example: Email service, payment processors, etc.
  
  return {
    status: 'healthy',
    message: 'No external dependencies configured',
    services: dependencies
  };
};

/**
 * Simple health endpoint for load balancers
 */
export const simpleHealthCheck = (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).send('OK');
  } else {
    res.status(503).send('Service Unavailable');
  }
};

/**
 * Detailed health endpoint
 */
export const detailedHealthCheck = async (req, res) => {
  try {
    const health = await getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'warning' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check endpoint error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure'
    });
  }
};

/**
 * Readiness probe for Kubernetes/Docker
 */
export const readinessCheck = async (req, res) => {
  try {
    // Check if the application is ready to serve traffic
    const isReady = mongoose.connection.readyState === 1;
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not connected'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

/**
 * Liveness probe for Kubernetes/Docker
 */
export const livenessCheck = (req, res) => {
  // Simple check to ensure the process is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

export default {
  getSystemHealth,
  simpleHealthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck
};
