/**
 * Test Utilities
 * 
 * Centralized testing utilities for React Testing Library
 */

import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from '../contexts/NotificationContext';

// Custom render function that includes providers
function render(ui, options = {}) {
  const {
    initialEntries = ['/'],
    route = '/',
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => {
    return (
      <BrowserRouter>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </BrowserRouter>
    );
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Custom render with router for testing navigation
function renderWithRouter(ui, options = {}) {
  const {
    initialEntries = ['/'],
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => {
    return (
      <BrowserRouter>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </BrowserRouter>
    );
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Render with custom providers
function renderWithProviders(ui, options = {}) {
  const {
    providers = [],
    ...renderOptions
  } = options;

  const AllProviders = ({ children }) => {
    return providers.reduce(
      (acc, Provider) => <Provider>{acc}</Provider>,
      <BrowserRouter>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </BrowserRouter>
    );
  };

  return rtlRender(ui, { wrapper: AllProviders, ...renderOptions });
}

// Mock data generators
export const mockData = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'editor',
    isActive: true,
  },
  
  blog: {
    _id: '1',
    title: 'Test Blog Post',
    content: 'This is test content for the blog post.',
    author: 'Test Author',
    category: 'Farming',
    tags: ['farming', 'test'],
    published: true,
    createdAt: new Date().toISOString(),
    imageUrl: '/test-image.jpg',
    views: 100,
    likes: 10,
    shares: 5,
  },
  
  news: {
    _id: '1',
    title: 'Test News Article',
    content: 'This is test news content.',
    author: 'News Author',
    category: 'general',
    published: true,
    isBreaking: false,
    createdAt: new Date().toISOString(),
  },
  
  event: {
    _id: '1',
    title: 'Test Event',
    description: 'This is a test event.',
    startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    location: 'Test Location',
    published: true,
  },
};

// Common test scenarios
export const testScenarios = {
  // Loading state
  loading: {
    isLoading: true,
    data: null,
    error: null,
  },
  
  // Success state
  success: (data) => ({
    isLoading: false,
    data,
    error: null,
  }),
  
  // Error state
  error: (message = 'Something went wrong') => ({
    isLoading: false,
    data: null,
    error: { message },
  }),
};

// Custom matchers for common assertions
export const customMatchers = {
  toBeVisible: (element) => {
    return element && element.style.display !== 'none' && element.style.visibility !== 'hidden';
  },
  
  toHaveLoadingState: (container) => {
    return container.querySelector('[data-testid="loading"]') !== null;
  },
  
  toHaveErrorState: (container) => {
    return container.querySelector('[data-testid="error"]') !== null;
  },
};

// Accessibility testing helpers
export const a11yHelpers = {
  // Check for proper heading hierarchy
  checkHeadingHierarchy: (container) => {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
    
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) {
        throw new Error(`Heading hierarchy violation: h${levels[i - 1]} followed by h${levels[i]}`);
      }
    }
    return true;
  },
  
  // Check for alt text on images
  checkImageAltText: (container) => {
    const images = container.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
    
    if (imagesWithoutAlt.length > 0) {
      throw new Error(`${imagesWithoutAlt.length} images found without alt text`);
    }
    return true;
  },
};

// Performance testing helpers
export const performanceHelpers = {
  // Measure component render time
  measureRenderTime: async (renderFn) => {
    const start = performance.now();
    await renderFn();
    const end = performance.now();
    return end - start;
  },
  
  // Check for memory leaks
  checkMemoryLeaks: (component) => {
    // This would integrate with actual memory profiling tools
    // For now, it's a placeholder for the concept
    return true;
  },
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export our custom render functions
export { render, renderWithRouter, renderWithProviders };