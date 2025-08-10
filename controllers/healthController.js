/**
 * @file Enhanced Health Check System
 * @description Comprehensive health monitoring for production systems
 * @module controllers/healthController
 */

import mongoose from 'mongoose';
import { getMetrics } from '../middleware/performanceMetrics.js';
import { getEnvironmentHealth } from '../utils/environmentValidator.js';

/**
 * System dependencies to check
 */
const dependencies = {
  database: {
    name: 'MongoDB',
    check: async () => {
      try {
        const state = mongoose.connection.readyState;
        const isConnected = state === 1;
        
        if (isConnected) {
          // Test database with a simple operation
          await mongoose.connection.db.admin().ping();
          return {
            status: 'healthy',
            responseTime: await measureDbResponseTime(),
            details: {
              state: getConnectionState(state),
              host: mongoose.connection.host,
              name: mongoose.connection.name
            }
          };
        } else {
          return {
            status: 'unhealthy',
            error: `Database state: ${getConnectionState(state)}`,
            details: { state: getConnectionState(state) }
          };
        }
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          details: { error: error.name }
        };
      }
    }
  },
  
  memory: {
    name: 'Memory Usage',
    check: async () => {
      try {
        const usage = process.memoryUsage();
        const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
        const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const usagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);
        
        const status = usagePercent > 90 ? 'unhealthy' : usagePercent > 75 ? 'warning' : 'healthy';
        
        return {
          status,
          details: {
            totalMB,
            usedMB,
            usagePercent,
            external: Math.round(usage.external / 1024 / 1024),
            rss: Math.round(usage.rss / 1024 / 1024)
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
  },
  
  disk: {
    name: 'Disk Space',
    check: async () => {
      try {
        // For production, you might want to check actual disk usage
        // This is a simplified check
        return {
          status: 'healthy',
          details: {
            message: 'Disk space check not implemented',
            recommendation: 'Implement actual disk space monitoring'
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
  },
  
  environment: {
    name: 'Environment Configuration',
    check: async () => {
      try {
        return getEnvironmentHealth();
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
  }
};

/**
 * Measure database response time
 */
async function measureDbResponseTime() {
  const start = Date.now();
  await mongoose.connection.db.admin().ping();
  return Date.now() - start;
}

/**
 * Get human-readable connection state
 */
function getConnectionState(state) {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[state] || 'unknown';
}

/**
 * Basic health check endpoint
 * @route GET /health
 */
export const basicHealthCheck = async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Detailed health check with dependency status
 * @route GET /api/health/detailed
 */
export const detailedHealthCheck = async (req, res) => {
  try {
    const startTime = Date.now();
    const dependencyResults = {};
    let overallStatus = 'healthy';
    
    // Check all dependencies
    for (const [key, dependency] of Object.entries(dependencies)) {
      try {
        dependencyResults[key] = await dependency.check();
        
        // Update overall status based on individual checks
        if (dependencyResults[key].status === 'unhealthy') {
          overallStatus = 'unhealthy';
        } else if (dependencyResults[key].status === 'warning' && overallStatus === 'healthy') {
          overallStatus = 'warning';
        }
      } catch (error) {
        dependencyResults[key] = {
          status: 'unhealthy',
          error: `Health check failed: ${error.message}`
        };
        overallStatus = 'unhealthy';
      }
    }
    
    const responseTime = Date.now() - startTime;
    const metrics = getMetrics();
    
    const health = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      system: {
        uptime: Math.floor(process.uptime()),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      dependencies: dependencyResults,
      performance: {
        requests: {
          total: metrics.requests.total,
          success: metrics.requests.success,
          errors: metrics.requests.errors,
          errorRate: metrics.requests.total > 0 ? 
            Math.round((metrics.requests.errors / metrics.requests.total) * 100) : 0,
          avgResponseTime: Math.round(metrics.requests.avgResponseTime)
        },
        database: {
          queries: metrics.database.queries,
          slowQueries: metrics.database.slowQueries,
          avgQueryTime: Math.round(metrics.database.avgQueryTime)
        }
      }
    };
    
    // Set appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'warning' ? 200 : 503;
    
    res.status(httpStatus).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Performance metrics endpoint
 * @route GET /api/metrics
 */
export const performanceMetrics = async (req, res) => {
  try {
    const metrics = getMetrics();
    
    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Readiness probe - checks if the application is ready to serve traffic
 * @route GET /ready
 */
export const readinessCheck = async (req, res) => {
  try {
    // Check critical dependencies for readiness
    const dbCheck = await dependencies.database.check();
    
    if (dbCheck.status === 'healthy') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        reason: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Liveness probe - checks if the application is running
 * @route GET /live
 */
export const livenessCheck = async (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
};

export default {
  basicHealthCheck,
  detailedHealthCheck,
  performanceMetrics,
  readinessCheck,
  livenessCheck
};
