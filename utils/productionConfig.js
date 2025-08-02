/**
 * @file productionConfig.js
 * @description Production environment configuration and optimization
 * Automatically applied when running in production (Railway, Heroku, AWS, etc.)
 */

/**
 * Production Environment Configuration
 * These settings are optimized for cloud platform deployment
 */
export const productionConfig = {
  // Memory optimization for cloud platforms (512MB typical limit)
  memory: {
    maxHeapSize: '450m',
    warningThreshold: 400, // MB
    criticalThreshold: 450, // MB
    gcInterval: 30000 // 30 seconds
  },
  
  // Performance settings for cloud container environments
  performance: {
    requestTimeout: 25000, // 25 seconds (most platforms have 30s timeout)
    keepAliveTimeout: 5000,
    headersTimeout: 10000,
    maxConnections: 100,
    maxSockets: 50
  },
  
  // Logging configuration for production
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: 'json', // Better for log aggregation
    maxFiles: 5,
    maxSize: '10m'
  },
  
  // Cache settings optimized for production
  cache: {
    ttl: 300, // 5 minutes default
    maxKeys: 1000,
    checkPeriod: 60 // Check for expired keys every minute
  },
  
  // Database connection optimization
  database: {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 10000
  }
};

/**
 * Apply production-specific optimizations to Node.js process
 */
export function applyProductionOptimizations() {
  if (process.env.NODE_ENV !== 'production') {
    return false; // Skip if not in production
  }
  
  // Set memory limits
  if (process.env.NODE_OPTIONS) {
    process.env.NODE_OPTIONS += ` --max-old-space-size=${productionConfig.memory.maxHeapSize}`;
  } else {
    process.env.NODE_OPTIONS = `--max-old-space-size=${productionConfig.memory.maxHeapSize}`;
  }
  
  // Enable garbage collection optimization
  if (!process.env.NODE_OPTIONS.includes('--expose-gc')) {
    process.env.NODE_OPTIONS += ' --expose-gc';
  }
  
  // Optimize event loop
  process.env.UV_THREADPOOL_SIZE = '8';
  
  return true;
}

/**
 * Production-specific middleware configuration
 */
export function getProductionMiddlewareConfig() {
  return {
    // Trust proxy configuration for cloud platforms
    trustProxy: process.env.NODE_ENV === 'production' ? 1 : false,
    
    // CORS settings for production domains
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [
            /\.railway\.app$/,
            /\.herokuapp\.com$/,
            /\.vercel\.app$/,
            /\.netlify\.app$/,
            process.env.FRONTEND_URL,
            process.env.DOMAIN
          ].filter(Boolean)
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      optionsSuccessStatus: 200
    },
    
    // Rate limiting for production
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    }
  };
}

/**
 * Environment validation for production deployment
 */
export function validateProductionEnvironment() {
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
    'EMAIL_USER',
    'EMAIL_PASS'
  ];
  
  const optional = [
    'REDIS_URL',
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  const optionalMissing = optional.filter(key => !process.env[key]);
  
  const validation = {
    valid: missing.length === 0,
    missing,
    optionalMissing,
    environment: {
      isProduction: process.env.NODE_ENV === 'production',
      platform: detectPlatform(),
      service: process.env.SERVICE_NAME || process.env.RAILWAY_SERVICE_NAME,
      replica: process.env.REPLICA_ID || process.env.RAILWAY_REPLICA_ID
    }
  };
  
  return validation;
}

/**
 * Detect the hosting platform
 */
function detectPlatform() {
  if (process.env.RAILWAY_ENVIRONMENT) return 'Railway';
  if (process.env.HEROKU_APP_NAME) return 'Heroku';
  if (process.env.VERCEL) return 'Vercel';
  if (process.env.NETLIFY) return 'Netlify';
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'AWS Lambda';
  return 'Unknown';
}

/**
 * Get production-optimized server configuration
 */
export function getProductionServerConfig() {
  const port = process.env.PORT || 3000;
  
  return {
    port,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
    timeout: productionConfig.performance.requestTimeout,
    keepAliveTimeout: productionConfig.performance.keepAliveTimeout,
    headersTimeout: productionConfig.performance.headersTimeout,
    maxHeadersCount: 100,
    maxRequestsPerSocket: 0 // Disable for cloud platforms
  };
}

export default productionConfig;
