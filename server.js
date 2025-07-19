

// Load environment variables before anything else
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');

// Load environment variables synchronously
try {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        throw result.error;
    }
    console.log('🔧 Environment Setup: Complete');
} catch (error) {
    console.error('❌ Error loading .env file:', error.message);
    process.exit(1);
}

// Load environment variables
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('\n❌ Error loading .env file:', result.error);
    process.exit(1);
}

// Configure VAPID keys
const vapidPublic = process.env.PUSH_NOTIFICATION_VAPID_PUBLIC;
const vapidPrivate = process.env.PUSH_NOTIFICATION_VAPID_PRIVATE;

if (!vapidPublic || !vapidPrivate) {
    // Generate and save new VAPID keys
    const webpush = (await import('web-push')).default;
    const vapidKeys = webpush.generateVAPIDKeys();
    
    // Append to .env file
    const fs = await import('fs');
    const newEnvContent = `\n# Push Notification VAPID Keys
PUSH_NOTIFICATION_VAPID_PUBLIC=${vapidKeys.publicKey}
PUSH_NOTIFICATION_VAPID_PRIVATE=${vapidKeys.privateKey}`;

    fs.appendFileSync(envPath, newEnvContent);
    
    // Load the new environment variables
    process.env.PUSH_NOTIFICATION_VAPID_PUBLIC = vapidKeys.publicKey;
    process.env.PUSH_NOTIFICATION_VAPID_PRIVATE = vapidKeys.privateKey;
    
    if (process.env.NODE_ENV !== 'production') {
        console.log('ℹ️ New VAPID keys generated');
    }
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Environment check
import fs from 'fs';
if (process.env.NODE_ENV !== 'production') {
  console.log('DEBUG: Environment setup completed');
  console.log('DEBUG: NODE_ENV:', process.env.NODE_ENV);
}

/**
 * @file server.js
 * @description Main server entry point for the Online Farming Magazine backend.
 * This server provides RESTful APIs for content management, authentication,
 * real-time notifications, email delivery, and media handling.
 * 
 * Features:
 * - Express-based REST API with modular architecture
 * - WebSocket integration for real-time notifications
 * - Enhanced security with CORS, helmet, rate limiting, and input sanitization
 * - Comprehensive logging and monitoring
 * - File upload and streaming capabilities
 * - Graceful shutdown handling
 * 
 * @author Online Farming Magazine Development Team
 * @lastUpdated June 12, 2025
 */

import express from 'express';


import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';

import { createServer } from 'http';
import connectDB from './config/db.js';
import upload from './middleware/fileUpload.js';
import { sanitizeInput, securityHeaders } from './middleware/sanitization.js';
import { requestLogger, errorLogger, logSecurityEvent } from './utils/logger.js';
// import { setupSwagger } from './config/swagger.js';

/**
 * Service declarations - initialized later via dynamic imports
 * Using dynamic imports allows for cleaner dependency management and
 * better error handling when loading modules
 */
let setupMonitoring, NotificationWebSocketService, NotificationTypes, createNotification, EmailService;

/**
 * Dynamically imports and initializes service modules
 * 
 * This approach:
 * 1. Improves startup reliability by handling import errors gracefully
 * 2. Supports both ESM and CommonJS modules through dynamic imports
 * 3. Allows better dependency isolation and testing
 * 
 * @async
 * @returns {Promise<void>} Resolves when all services are initialized
 */
async function initializeServices() {
  const monitoringModule = await import('./services/monitoringService.js');
  const wsModule = await import('./services/notificationWebSocketService.js');
  const emailModule = await import('./services/emailService.js');
  
  setupMonitoring = monitoringModule.setupMonitoring;
  NotificationWebSocketService = wsModule.NotificationWebSocketService;
  NotificationTypes = wsModule.NotificationTypes;
  createNotification = wsModule.createNotification;
  EmailService = emailModule.default;
}

/**
 * Environment and runtime configuration
 * 
 * Sets default environment and creates necessary ES module compatibility shims
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
console.log('Node version:', process.version); // Log Node.js version for diagnostics

/**
 * ES Modules compatibility setup
 * 
 * Creating __dirname equivalent for ES modules since it's not natively available
 * This enables path operations consistent with CommonJS patterns
 */
// __dirname and envPath are already defined at the top of the file

/**
 * Application initialization
 * 
 * Creates the Express application instance and HTTP server
 * The separate HTTP server enables WebSocket support alongside Express
 */
const app = express();
const server = createServer(app);

/**
 * Service instances declaration
 * 
 * These services will be initialized during the startup process:
 * - emailService: Handles email delivery and templating
 * - notificationService: WebSocket-based real-time notifications
 * - logger: Centralized application logging
 * - performanceMonitor: Tracks application metrics
 * - healthChecker: Provides system health status
 * - errorTracker: Captures and reports errors
 */
let emailService, notificationService, logger, performanceMonitor, healthChecker, errorTracker;

/**
 * Server initialization sequence
 * 
 * Orchestrates the startup of all server components in the correct order:
 * 1. Loads service modules
 * 2. Initializes core services (email, notifications)
 * 3. Sets up monitoring infrastructure
 * 4. Configures WebSocket server and event handlers
 * 
 * Implements proper error handling with descriptive logging and clean exit
 * in case of initialization failures.
 * 
 * @async
 * @returns {Promise<void>} Resolves when server is fully initialized
 * @throws Will exit process on critical initialization failure
 */
async function initializeServer() {
  try {
    // Initialize service modules first to ensure dependencies are available
    await initializeServices();
    
    // Create service instances with proper initialization order
    emailService = new EmailService();
    notificationService = new NotificationWebSocketService();
    
    // Setup monitoring and observability infrastructure
    // This provides logging, performance tracking, and health monitoring
    ({ logger, performanceMonitor, healthChecker, errorTracker } = setupMonitoring(app));
    
    // Performance monitoring is already applied in setupMonitoring
    // No need to apply it again here
    
    // Initialize WebSocket service for real-time communication
    notificationService.initialize(server);
    notificationService.startHeartbeat(); // Ensures connection stability

    /**
     * WebSocket event handlers
     * 
     * Configures event listeners for connection lifecycle and message processing
     * Each handler includes proper logging and error handling
     */
    
    // Handle new user connections
    notificationService.on('userConnected', (data) => {
      logger.info('User connected to WebSocket', data);
      performanceMonitor.setActiveConnections(data.connectionCount);
    });

    // Handle user disconnections 
    notificationService.on('userDisconnected', (data) => {
      logger.info('User disconnected from WebSocket', data);
      performanceMonitor.setActiveConnections(data.connectionCount);
    });

    // Handle notification status updates
    notificationService.on('markNotificationRead', async (data) => {
      try {
        // Update notification status in database
        logger.info('Notification marked as read', data);
      } catch (error) {
        errorTracker.trackError(error);
      }
    });
    
    console.log('✅ Services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1); // Exit with error code to trigger container restart
  }
}

/**
 * CORS Configuration
 * 
 * Environment-aware CORS setup that:
 * - Uses restrictive origin in production (single frontend domain)
 * - Allows multiple development origins in non-production
 * - Supports credentials for authenticated requests
 * - Configures headers needed for content streaming
 * 
 * This dual configuration enhances security in production while
 * maintaining development flexibility.
 */
const corsOrigin = process.env.NODE_ENV === 'production' 
  ? [
      'https://ishaazilivestockservices.com',
      'https://www.ishaazilivestockservices.com', 
      'https://ishaazi-livestock-services-production.up.railway.app',
      process.env.FRONTEND_URL
    ] // Production domains
  : ['http://localhost:3000', 'http://127.0.0.1:3000']; // Multiple local origins in development

// Apply CORS middleware with comprehensive configuration
app.use(cors({
  origin: corsOrigin,
  credentials: true, // Enables cookies and authentication headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'cache-control', 
    'Accept', 
    'Origin', 
    'if-none-match', 
    'Range'  // Required for media streaming
  ],
  exposedHeaders: [
    'Content-Range', 
    'Accept-Ranges', 
    'Content-Length'  // Required for video/audio streaming functionality
  ],
}));

app.options('*', cors());

/**
 * Security Configuration - Helmet
 * 
 * Comprehensive Content Security Policy (CSP) implementation that:
 * 1. Restricts resource loading to specific trusted domains
 * 2. Configures appropriate policies for various content types
 * 3. Balances security with functionality requirements
 * 4. Includes special configurations for development environments
 * 
 * The implementation follows security best practices while maintaining
 * compatibility with modern web application features.
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],  // Default: only allow content from same origin
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",  // Required for styled-components and other CSS-in-JS libraries
        "https://fonts.googleapis.com", 
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com",  // Google Fonts
        "https://cdn.jsdelivr.net"    // CDN for icon fonts
      ],
      imgSrc: [
        "'self'", 
        "data:",  // Support for data URIs (inline images)
        "https:",  // Allow HTTPS images from any domain
        "http://localhost:5000"  // Local development server
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'",  // Necessary for some React features
        "'unsafe-eval'"     // Required for hot module reload in development
      ], 
      connectSrc: [
        "'self'", 
        "http://localhost:5000",  // API connections
        "ws://localhost:3000"     // WebSocket connections
      ],
      mediaSrc: [
        "'self'", 
        "http://localhost:5000"  // Media streaming from local server
      ],
      objectSrc: ["'none'"],    // Disallow <object>, <embed>, and <applet> elements
      frameSrc: ["'none'"]      // Disallow iframes
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },  // Allow cross-origin resource sharing
  hsts: {
    maxAge: 31536000,           // 1 year in seconds
    includeSubDomains: true,    // Apply to all subdomains
    preload: true               // Allow preloading in browsers
  }
}));

/**
 * Rate Limiting Protection
 * 
 * Environment-aware rate limiting that:
 * - Applies stricter limits in production
 * - Provides more flexibility in development
 * - Uses a sliding window algorithm (15-minute periods)
 * - Returns informative error messages
 * 
 * This helps prevent abuse, brute force attacks, and service overloading
 * while allowing normal development activities.
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15-minute sliding window
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,  // Environment-specific limits
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,        // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,         // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Parse incoming requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Prevent NoSQL injection attacks
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Potential NoSQL injection attempt detected: ${key} from IP: ${req.ip}`);
  }
}));

// Add security headers
app.use(securityHeaders);

// Sanitize all input
app.use(sanitizeInput);

// Request logging
app.use(requestLogger);

// Static cache headers (performance monitor will be added after initialization)
import { staticCacheHeaders } from './middleware/performanceMetrics.js';
import { httpCacheHeaders } from './middleware/enhancedCache.js';
app.use(staticCacheHeaders);
app.use('/api/static', httpCacheHeaders(86400)); // 24 hours for static content

// Database connection
connectDB()
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

// Ensure uploads directories exist (only in development - Railway handles this in production)
if (process.env.NODE_ENV !== 'production') {
  const uploadsDir = path.join(__dirname, 'uploads', 'images');
  const mediaDir = path.join(__dirname, 'uploads', 'media');
  const pdfsDir = path.join(__dirname, 'uploads', 'pdfs');

  [uploadsDir, mediaDir, pdfsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`${dir} directory created.`);
    }
  });
}

// Middleware for handling video streaming with range requests
app.get('/uploads/media/:filename', (req, res) => {
  const mediaPath = process.env.NODE_ENV === 'production' 
    ? path.join('/uploads', 'media', req.params.filename)
    : path.join(__dirname, 'uploads', 'media', req.params.filename);
  
  // Check if file exists
  fs.stat(mediaPath, (err, stats) => {
    if (err) {
      console.error(`Error accessing file: ${err.message}`);
      return res.status(404).send('File not found');
    }
    
    // Get file size
    const fileSize = stats.size;
    const range = req.headers.range;
    
    // Get file extension for content type
    const ext = path.extname(mediaPath).toLowerCase();
    const contentTypeMap = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav'
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    // Handle range requests (for video streaming)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      
      // Range request is being processed
      
      // Set response headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });
      
      // Create read stream for the specified range
      const fileStream = fs.createReadStream(mediaPath, { start, end });
      
      // Pipe the file stream to the response
      fileStream.pipe(res);
    } else {
      // If no range is specified, send the entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });
      
      // Create read stream for the entire file
      const fileStream = fs.createReadStream(mediaPath);
      
      // Pipe the file stream to the response
      fileStream.pipe(res);
    }
  });
});

// Serve static files with proper headers - supports both Railway volumes and local development
const uploadsPath = process.env.NODE_ENV === 'production' ? '/uploads' : path.join(__dirname, 'uploads');
app.use(
  '/uploads',
  express.static(uploadsPath, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav'
      };
      
      // Set Content-Type
      res.set('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      
      // Set CORS headers
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // For media files, set range request headers
      if (['.mp4', '.webm', '.ogg', '.mov', '.mp3', '.wav'].includes(ext)) {
        res.set('Accept-Ranges', 'bytes');
      }
    }
  })
);

// Request logger (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.file) {
      console.log('Uploaded file details:', req.file);
    }
    if (req.method !== 'GET') console.log('Body:', req.body);
    next();
  });
}

// Import routes
import enhancedAdminRoutes from './routes/enhancedAdminRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import emailTestRoutes from './routes/emailTestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import syndicationRoutes from './routes/syndicationRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import pushSubscriptionRoutes from './routes/pushSubscriptionRoutes.js';

// API Documentation with Swagger
// setupSwagger(app);

// Mount routes
app.use('/health', healthRoutes); // Health checks (no /api prefix for direct access)
app.use('/api/health', healthRoutes); // Health checks with /api prefix
app.use('/ready', healthRoutes); // Kubernetes readiness probe
app.use('/live', healthRoutes); // Kubernetes liveness probe
app.use('/api/admin', enhancedAdminRoutes); // Enhanced admin routes
app.use('/api/content', contentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/email', emailTestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/syndication', syndicationRoutes); // RSS feeds and sitemaps
app.use('/api/push', pushSubscriptionRoutes); // Push notification subscriptions

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File upload failed', error: 'No file provided' });
  }
  res.status(201).json({
    message: 'File uploaded successfully',
    file: {
      path: `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`,
      name: req.file.originalname,
      type: req.file.mimetype,
    },
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Welcome to the Online Farming Magazine API');
});

// Error logging middleware
app.use(errorLogger);

// Global error-handling middleware
app.use((err, req, res, next) => {
  // Log security-related errors
  if (err.message.includes('CSRF') || err.message.includes('injection') || err.message.includes('XSS')) {
    logSecurityEvent('SECURITY_ERROR', {
      error: err.message,
      stack: err.stack
    }, req);
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal Server Error' : err.message,
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

// Enhanced health check endpoints
app.get('/api/health/detailed', async (req, res) => {
  try {
    const health = await healthChecker.runChecks();
    const metrics = performanceMonitor.getMetrics();
    const wsStats = notificationService.getStats();
    const emailStats = emailService.getStats();
    
    res.json({
      status: health.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      services: {
        database: health.checks.database || { status: 'unknown' },
        email: await emailService.healthCheck(),
        websocket: wsStats,
        memory: health.checks.memory || { status: 'unknown' }
      },
      performance: metrics
    });
  } catch (error) {
    errorTracker.trackError(error);
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// WebSocket stats endpoint
app.get('/api/websocket/stats', (req, res) => {
  try {
    const stats = notificationService.getStats();
    res.json(stats);
  } catch (error) {
    errorTracker.trackError(error);
    res.status(500).json({ error: 'Failed to get WebSocket stats' });
  }
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    res.json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
      },
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      ...metrics
    });
  } catch (error) {
    errorTracker.trackError(error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    
    // Close WebSocket connections
    notificationService.shutdown();
    console.log('WebSocket service shut down.');
    
    // Close database connection
    // Add your database close logic here
    
    console.log('Graceful shutdown completed.');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
// Start the server with proper initialization
async function startServer() {
  try {
    await initializeServer();
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server started successfully in ${process.env.NODE_ENV} mode`);
      
      // Log startup performance
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        }
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Initialize and start the server
startServer();

export default app;