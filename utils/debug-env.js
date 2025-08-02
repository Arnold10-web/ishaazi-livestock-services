/**
 * @file Environment Debug Utility
 * @description Enhanced environment debugging and configuration for production environments
 * @module utils/debug-env
 */

import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

// Load environment variables (production environments use system env vars)
if (process.env.NODE_ENV !== 'production') {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn(`.env file error: ${result.error.message}; using system env`);
  }
}

/**
 * Environment configuration validation
 * @returns {Object} Configuration status and warnings
 */
export const validateEnvironment = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'PORT'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  const warnings = [];
  
  if (missing.length > 0) {
    warnings.push(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    const prodRequired = ['EMAIL_USER', 'EMAIL_PASS'];
    const missingProd = prodRequired.filter(key => !process.env[key]);
    
    if (missingProd.length > 0) {
      warnings.push(`Missing production environment variables: ${missingProd.join(', ')}`);
    }
  }
  
  return {
    isValid: missing.length === 0,
    warnings,
    environment: process.env.NODE_ENV || 'development'
  };
};

/**
 * Debug environment variables (development only)
 */
export const debugEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    return; // Don't debug in production
  }
  
  const config = validateEnvironment();
  console.log('Environment validation:', config);
};
