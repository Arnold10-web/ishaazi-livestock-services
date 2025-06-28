// Database monitoring and performance dashboard
import mongoose from 'mongoose';
import { performance } from 'perf_hooks';

class DatabaseMonitor {
  constructor() {
    this.metrics = {
      queries: [],
      slowQueries: [],
      errors: [],
      connections: 0,
      lastHealthCheck: null
    };
    this.slowQueryThreshold = 1000; // 1 second
    this.maxMetricsHistory = 1000;
    
    this.setupMonitoring();
  }

  setupMonitoring() {
    // Monitor connection events
    mongoose.connection.on('connected', () => {
      console.log('📊 Database connected');
      this.metrics.connections++;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📊 Database disconnected');
      this.metrics.connections = Math.max(0, this.metrics.connections - 1);
    });

    mongoose.connection.on('error', (error) => {
      console.error('📊 Database error:', error);
      this.recordError(error);
    });

    // Set up query monitoring
    this.setupQueryMonitoring();
  }

  setupQueryMonitoring() {
    // Override mongoose query execution to monitor performance
    const originalExec = mongoose.Query.prototype.exec;
    
    mongoose.Query.prototype.exec = function(...args) {
      const startTime = performance.now();
      const collection = this.getQuery ? this.getQuery().collection : 'unknown';
      const operation = this.op;
      
      return originalExec.apply(this, args)
        .then(result => {
          const duration = performance.now() - startTime;
          
          // Record query metrics
          const queryMetric = {
            collection,
            operation,
            duration: Math.round(duration),
            timestamp: new Date(),
            query: this.getQuery ? this.getQuery() : {},
            success: true
          };
          
          global.dbMonitor?.recordQuery(queryMetric);
          
          return result;
        })
        .catch(error => {
          const duration = performance.now() - startTime;
          
          const queryMetric = {
            collection,
            operation,
            duration: Math.round(duration),
            timestamp: new Date(),
            query: this.getQuery ? this.getQuery() : {},
            success: false,
            error: error.message
          };
          
          global.dbMonitor?.recordQuery(queryMetric);
          throw error;
        });
    };
  }

  recordQuery(queryMetric) {
    // Add to metrics
    this.metrics.queries.push(queryMetric);
    
    // Track slow queries
    if (queryMetric.duration > this.slowQueryThreshold) {
      this.metrics.slowQueries.push(queryMetric);
      console.warn(`🐌 Slow query detected: ${queryMetric.collection}.${queryMetric.operation} - ${queryMetric.duration}ms`);
    }

    // Limit history size
    if (this.metrics.queries.length > this.maxMetricsHistory) {
      this.metrics.queries = this.metrics.queries.slice(-this.maxMetricsHistory);
    }
    
    if (this.metrics.slowQueries.length > 100) {
      this.metrics.slowQueries = this.metrics.slowQueries.slice(-100);
    }
  }

  recordError(error) {
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date()
    });
    
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }
  }

  async getHealthStatus() {
    try {
      const dbStats = await mongoose.connection.db.stats();
      const adminDB = mongoose.connection.db.admin();
      const serverStatus = await adminDB.serverStatus();
      
      const health = {
        status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
        connections: serverStatus.connections,
        uptime: serverStatus.uptime,
        memory: {
          resident: serverStatus.mem.resident,
          virtual: serverStatus.mem.virtual,
          mapped: serverStatus.mem.mapped
        },
        database: {
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexSize: dbStats.indexSize,
          collections: dbStats.collections,
          objects: dbStats.objects
        },
        operations: {
          totalQueries: this.metrics.queries.length,
          slowQueries: this.metrics.slowQueries.length,
          errors: this.metrics.errors.length,
          avgQueryTime: this.getAverageQueryTime()
        },
        timestamp: new Date()
      };
      
      this.metrics.lastHealthCheck = health;
      return health;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  getAverageQueryTime() {
    if (this.metrics.queries.length === 0) return 0;
    
    const total = this.metrics.queries.reduce((sum, query) => sum + query.duration, 0);
    return Math.round(total / this.metrics.queries.length);
  }

  getMetrics() {
    return {
      ...this.metrics,
      summary: {
        totalQueries: this.metrics.queries.length,
        slowQueries: this.metrics.slowQueries.length,
        errorRate: this.metrics.queries.length > 0 
          ? (this.metrics.errors.length / this.metrics.queries.length * 100).toFixed(2) 
          : 0,
        avgQueryTime: this.getAverageQueryTime(),
        slowQueryRate: this.metrics.queries.length > 0
          ? (this.metrics.slowQueries.length / this.metrics.queries.length * 100).toFixed(2)
          : 0
      }
    };
  }

  // Get query performance by collection
  getCollectionStats() {
    const stats = {};
    
    this.metrics.queries.forEach(query => {
      if (!stats[query.collection]) {
        stats[query.collection] = {
          count: 0,
          totalTime: 0,
          slowQueries: 0,
          errors: 0
        };
      }
      
      stats[query.collection].count++;
      stats[query.collection].totalTime += query.duration;
      
      if (query.duration > this.slowQueryThreshold) {
        stats[query.collection].slowQueries++;
      }
      
      if (!query.success) {
        stats[query.collection].errors++;
      }
    });
    
    // Calculate averages
    Object.keys(stats).forEach(collection => {
      const collectionStats = stats[collection];
      collectionStats.avgTime = Math.round(collectionStats.totalTime / collectionStats.count);
      collectionStats.slowQueryRate = (collectionStats.slowQueries / collectionStats.count * 100).toFixed(2);
      collectionStats.errorRate = (collectionStats.errors / collectionStats.count * 100).toFixed(2);
    });
    
    return stats;
  }

  // Reset metrics
  reset() {
    this.metrics.queries = [];
    this.metrics.slowQueries = [];
    this.metrics.errors = [];
  }
}

// Create global instance
global.dbMonitor = new DatabaseMonitor();

export default DatabaseMonitor;
