// Jest setup file
import { jest } from '@jest/globals';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/trial_test';

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests unless needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock file upload middleware globally
jest.mock('./middleware/fileUpload.js', () => ({
  single: () => (req, res, next) => {
    req.file = { filename: 'test-image.jpg' };
    next();
  }
}));

// Increase timeout for database operations
jest.setTimeout(30000);
