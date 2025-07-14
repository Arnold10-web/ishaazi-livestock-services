/**
 * Enhanced Test Setup for React Testing Library
 * 
 * This file sets up the testing environment with comprehensive utilities,
 * mocks, and configurations for React component testing.
 */

import '@testing-library/jest-dom';

// Configure React Testing Library if available
try {
  const { configure } = require('@testing-library/react');
  configure({
    testIdAttribute: 'data-testid',
    asyncUtilTimeout: 5000,
  });
} catch (error) {
  // React Testing Library not available, skip configuration
  console.warn('React Testing Library not available for configuration');
}

// Mock Service Worker setup - conditional import
let server;
try {
  const { server: mswServer } = require('./test-utils/mocks/server');
  server = mswServer;
} catch (error) {
  // MSW server not available, create a mock
  server = {
    listen: jest.fn(),
    resetHandlers: jest.fn(),
    close: jest.fn(),
  };
}

beforeAll(() => {
  // Start the MSW server
  if (server && server.listen) {
    server.listen({
      onUnhandledRequest: 'warn',
    });
  }
});

afterEach(() => {
  // Reset any request handlers that are declared as a part of our tests
  if (server && server.resetHandlers) {
    server.resetHandlers();
  }
  
  // Clean up any timers
  jest.clearAllTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
});

afterAll(() => {
  // Clean up after the tests are finished
  if (server && server.close) {
    server.close();
  }
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock fetch if not already mocked by MSW
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
global.testUtils = {
  // Wait for async operations
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock file for file upload tests
  createMockFile: (name = 'test.jpg', type = 'image/jpeg') => {
    return new File(['test content'], name, { type });
  },
  
  // Mock image load event
  mockImageLoad: (img) => {
    Object.defineProperty(img, 'naturalHeight', { value: 100 });
    Object.defineProperty(img, 'naturalWidth', { value: 100 });
    img.onload();
  },
  
  // Mock error for testing error boundaries
  mockConsoleError: () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    return spy;
  }
};