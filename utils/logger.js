import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Security logs
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
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

/**
 * Log security events
 * @param {string} event - Type of security event
 * @param {Object} details - Event details
 * @param {Object} req - Express request object (optional)
 */
export const logSecurityEvent = (event, details, req = null) => {
  const securityLog = {
    event,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  if (req) {
    securityLog.ip = req.ip || req.connection.remoteAddress;
    securityLog.userAgent = req.get('User-Agent');
    securityLog.url = req.originalUrl;
    securityLog.method = req.method;
    securityLog.userId = req.user?.id || 'anonymous';
  }
  
  logger.warn('SECURITY_EVENT', securityLog);
};

/**
 * Log authentication events
 * @param {string} action - Authentication action (login, logout, failed_login, etc.)
 * @param {Object} details - Event details
 * @param {Object} req - Express request object
 */
export const logAuthEvent = (action, details, req) => {
  logSecurityEvent('AUTH_EVENT', {
    action,
    ...details
  }, req);
};

/**
 * Log file upload events
 * @param {string} action - Upload action (upload_success, upload_failed, suspicious_file)
 * @param {Object} details - Event details
 * @param {Object} req - Express request object
 */
export const logFileEvent = (action, details, req) => {
  logSecurityEvent('FILE_EVENT', {
    action,
    ...details
  }, req);
};

/**
 * Log API access events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} responseTime - Response time in milliseconds
 */
export const logApiAccess = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  };
  
  if (res.statusCode >= 400) {
    logger.error('API_ERROR', logData);
  } else if (responseTime > 1000) {
    logger.warn('SLOW_API', logData);
  } else {
    logger.info('API_ACCESS', logData);
  }
};

/**
 * Log application errors
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 * @param {Object} req - Express request object (optional)
 */
export const logError = (error, context = {}, req = null) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    ...context
  };
  
  if (req) {
    errorLog.url = req.originalUrl;
    errorLog.method = req.method;
    errorLog.ip = req.ip;
    errorLog.userId = req.user?.id || 'anonymous';
  }
  
  logger.error('APPLICATION_ERROR', errorLog);
};

/**
 * Log performance metrics
 * @param {string} operation - Operation name
 * @param {number} duration - Duration in milliseconds
 * @param {Object} metadata - Additional metadata
 */
export const logPerformance = (operation, duration, metadata = {}) => {
  const perfLog = {
    operation,
    duration: `${duration}ms`,
    ...metadata
  };
  
  if (duration > 1000) {
    logger.warn('SLOW_OPERATION', perfLog);
  } else {
    logger.info('PERFORMANCE', perfLog);
  }
};

/**
 * Express middleware for request logging
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    logApiAccess(req, res, responseTime);
    originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Express middleware for error logging
 */
export const errorLogger = (err, req, res, next) => {
  logError(err, {
    statusCode: res.statusCode || 500
  }, req);
  
  next(err);
};

// Export the main logger instance
export default logger;
