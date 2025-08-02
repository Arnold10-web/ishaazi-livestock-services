/**
 * @file Production Optimization Utilities
 * @description Utilities for optimizing the application in production environment
 * @module utils/productionOptimization
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Production environment validator
 * Ensures all critical environment variables are present
 */
export const validateProductionEnvironment = () => {
  const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'EMAIL_USER',
    'EMAIL_PASS',
    'EMAIL_HOST',
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'VAPID_EMAIL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate email configuration
  if (!process.env.EMAIL_HOST.includes('mail.ishaazilivestockservices.com') && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Production email host should use mail.ishaazilivestockservices.com');
  }

  return true;
};

/**
 * Performance optimization settings for production
 */
export const getProductionSettings = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // Logging levels
    logging: {
      level: isProduction ? 'warn' : 'debug',
      maxFiles: isProduction ? 5 : 10,
      maxSize: isProduction ? '5m' : '20m'
    },
    
    // Cache settings
    cache: {
      defaultTTL: isProduction ? 900 : 300, // 15 min prod, 5 min dev
      maxKeys: isProduction ? 1000 : 100,
      checkperiod: isProduction ? 600 : 120
    },
    
    // Rate limiting
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProduction ? 100 : 1000, // Stricter in production
      skipSuccessfulRequests: isProduction,
      skipFailedRequests: false
    },
    
    // File upload limits
    upload: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      imageOptimization: isProduction
    },
    
    // Database settings
    database: {
      maxPoolSize: isProduction ? 20 : 10,
      serverSelectionTimeoutMS: isProduction ? 5000 : 30000,
      socketTimeoutMS: isProduction ? 45000 : 0
    }
  };
};

/**
 * Memory usage optimization
 */
export const optimizeMemoryUsage = () => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Set memory limits for production
  if (process.env.NODE_ENV === 'production') {
    // Set max memory usage to 80% of available RAM
    const totalMemory = require('os').totalmem();
    const maxMemory = Math.floor(totalMemory * 0.8);
    
    process.setMaxListeners(50); // Increase listener limit
    
    return {
      memoryLimit: maxMemory,
      heapSize: process.memoryUsage().heapUsed
    };
  }
  
  return null;
};

/**
 * Clean up temporary files and optimize filesystem
 */
export const cleanupFileSystem = async () => {
  const cleanupPaths = [
    path.join(__dirname, '..', 'logs', 'old'),
    path.join(__dirname, '..', 'temp'),
    path.join(__dirname, '..', 'uploads', 'temp')
  ];
  
  const results = [];
  
  for (const cleanupPath of cleanupPaths) {
    try {
      const exists = await fs.access(cleanupPath).then(() => true).catch(() => false);
      if (exists) {
        const files = await fs.readdir(cleanupPath);
        let cleaned = 0;
        
        for (const file of files) {
          const filePath = path.join(cleanupPath, file);
          const stats = await fs.stat(filePath);
          
          // Remove files older than 7 days
          const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
          if (ageInDays > 7) {
            await fs.unlink(filePath);
            cleaned++;
          }
        }
        
        results.push({ path: cleanupPath, filesRemoved: cleaned });
      }
    } catch (error) {
      results.push({ path: cleanupPath, error: error.message });
    }
  }
  
  return results;
};

/**
 * Process optimization for production
 */
export const optimizeProcess = () => {
  if (process.env.NODE_ENV === 'production') {
    // Handle uncaught exceptions gracefully
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);
      process.exit(0);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
};

export default {
  validateProductionEnvironment,
  getProductionSettings,
  optimizeMemoryUsage,
  cleanupFileSystem,
  optimizeProcess
};
