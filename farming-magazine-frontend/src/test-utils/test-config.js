/**
 * Test Configuration
 * 
 * Centralized configuration for all testing utilities and strategies
 */

// Test environment configuration
export const testConfig = {
  // Timeout settings
  timeouts: {
    default: 5000,
    integration: 10000,
    visual: 30000,
    accessibility: 15000,
  },

  // Coverage thresholds
  coverage: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    components: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    hooks: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    contexts: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Accessibility testing configuration
  accessibility: {
    rules: {
      'color-contrast': { enabled: false }, // Disable for testing (can be flaky)
      'aria-allowed-attr': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'button-name': { enabled: true },
      'heading-order': { enabled: true },
      'image-alt': { enabled: true },
      'label': { enabled: true },
      'link-name': { enabled: true },
      'list': { enabled: true },
      'listitem': { enabled: true },
      'region': { enabled: true },
      'skip-link': { enabled: true },
      'tabindex': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  },

  // Visual regression testing configuration
  visualRegression: {
    threshold: 0.1, // 0.1% difference threshold
    viewports: [
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1280, height: 720, name: 'desktop' },
      { width: 1920, height: 1080, name: 'large-desktop' },
    ],
    delay: 500, // Wait time before screenshot
    fullPage: true,
  },

  // Performance testing configuration
  performance: {
    renderTimeThreshold: 100, // ms
    memoryLeakThreshold: 10, // MB
    bundleSizeThreshold: 500, // KB
  },

  // Mock data for testing
  mockData: {
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

    comments: [
      {
        _id: '1',
        author: 'John Doe',
        email: 'john@example.com',
        content: 'Great article!',
        approved: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: '2',
        author: 'Jane Smith',
        email: 'jane@example.com',
        content: 'Very informative, thanks!',
        approved: false,
        createdAt: new Date().toISOString(),
      },
    ],

    searchSuggestions: [
      { text: 'dairy farming', type: 'popular', contentType: 'blog', searchCount: 150 },
      { text: 'dairy cattle', type: 'recent', contentType: 'news' },
      { text: 'dairy nutrition', type: 'tag', contentType: 'article' },
      { text: 'beef farming', type: 'popular', contentType: 'blog', searchCount: 120 },
      { text: 'livestock management', type: 'recent', contentType: 'guide' },
    ],

    notifications: [
      {
        _id: '1',
        message: 'New blog post published',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        _id: '2',
        message: 'Comment awaiting approval',
        type: 'warning',
        read: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
    ],
  },

  // API endpoints for testing
  apiEndpoints: {
    base: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    auth: {
      login: '/admin/login',
      register: '/admin/register',
      logout: '/admin/logout',
      refresh: '/admin/refresh',
    },
    content: {
      blogs: '/content/blogs',
      news: '/content/news',
      events: '/content/events',
    },
    engagement: {
      view: (contentType, id) => `/content/track/view/${contentType}/${id}`,
      like: (contentType, id) => `/content/track/like/${contentType}/${id}`,
      share: (contentType, id) => `/content/track/share/${contentType}/${id}`,
      stats: (contentType, id) => `/content/stats/${contentType}/${id}`,
    },
    search: {
      query: '/search',
      suggestions: '/search/suggestions',
      analytics: '/search/analytics/track',
    },
    newsletter: {
      subscribe: '/content/subscribers',
      unsubscribe: '/content/subscribers/unsubscribe',
    },
  },

  // Test scenarios for different states
  testScenarios: {
    loading: {
      isLoading: true,
      data: null,
      error: null,
    },
    
    success: (data) => ({
      isLoading: false,
      data,
      error: null,
    }),
    
    error: (message = 'Something went wrong') => ({
      isLoading: false,
      data: null,
      error: { message },
    }),

    empty: {
      isLoading: false,
      data: [],
      error: null,
    },

    pagination: (data, page = 1, limit = 10) => ({
      isLoading: false,
      data: {
        items: data,
        total: data.length,
        page,
        limit,
        totalPages: Math.ceil(data.length / limit),
      },
      error: null,
    }),
  },

  // Component test configurations
  components: {
    Header: {
      testStates: ['default', 'scrolled', 'mobile-menu-open'],
      accessibilityRequirements: {
        hasNavigation: true,
        hasSkipLink: false,
      },
      performanceThresholds: {
        renderTime: 50,
      },
    },

    SearchBar: {
      testStates: ['default', 'expanded', 'with-suggestions', 'loading'],
      accessibilityRequirements: {
        hasProperLabels: true,
        supportsKeyboardNavigation: true,
      },
      performanceThresholds: {
        renderTime: 30,
        debounceDelay: 300,
      },
    },

    BlogList: {
      testStates: ['loading', 'empty', 'with-data', 'error'],
      accessibilityRequirements: {
        hasProperHeadings: true,
        hasAltText: true,
      },
      performanceThresholds: {
        renderTime: 100,
        virtualScrolling: true,
      },
    },

    NewsletterForm: {
      testStates: ['default', 'loading', 'success', 'error'],
      accessibilityRequirements: {
        hasFormLabels: true,
        hasErrorMessages: true,
      },
      performanceThresholds: {
        renderTime: 40,
      },
    },
  },

  // Integration test configurations
  integration: {
    userWorkflows: [
      'navigation',
      'search',
      'content-interaction',
      'newsletter-subscription',
      'mobile-navigation',
    ],
    
    apiIntegration: [
      'authentication',
      'content-fetching',
      'engagement-tracking',
      'search-functionality',
      'error-handling',
    ],
  },

  // Test utilities configuration
  utilities: {
    customMatchers: {
      toBeVisible: true,
      toHaveLoadingState: true,
      toHaveErrorState: true,
      toBeAccessible: true,
    },
    
    mockProviders: [
      'BrowserRouter',
      'NotificationProvider',
      'AuthProvider',
      'ThemeProvider',
    ],
  },
};

// Test helper functions
export const testHelpers = {
  /**
   * Create a mock API response
   */
  createMockResponse: (data, success = true, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({
      success,
      data,
      message: success ? 'Success' : 'Error',
    }),
  }),

  /**
   * Create a mock error response
   */
  createMockError: (message = 'API Error', status = 500) => ({
    ok: false,
    status,
    json: () => Promise.resolve({
      success: false,
      message,
    }),
  }),

  /**
   * Wait for a specific condition
   */
  waitForCondition: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Condition timeout'));
        } else {
          setTimeout(check, 100);
        }
      };
      
      check();
    });
  },

  /**
   * Create a mock file for upload testing
   */
  createMockFile: (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
    const content = new Array(size).fill('a').join('');
    return new File([content], name, { type });
  },

  /**
   * Mock intersection observer
   */
  mockIntersectionObserver: () => {
    global.IntersectionObserver = class IntersectionObserver {
      constructor(callback) {
        this.callback = callback;
      }
      
      observe() {
        // Simulate intersection
        this.callback([{ isIntersecting: true }]);
      }
      
      disconnect() {}
      unobserve() {}
    };
  },

  /**
   * Mock resize observer
   */
  mockResizeObserver: () => {
    global.ResizeObserver = class ResizeObserver {
      constructor(callback) {
        this.callback = callback;
      }
      
      observe() {
        // Simulate resize
        this.callback([{ contentRect: { width: 1280, height: 720 } }]);
      }
      
      disconnect() {}
      unobserve() {}
    };
  },

  /**
   * Mock media query
   */
  mockMediaQuery: (matches = false) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  },

  /**
   * Mock local storage
   */
  mockLocalStorage: () => {
    const store = {};
    
    global.localStorage = {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: jest.fn(key => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
    };
    
    return store;
  },

  /**
   * Mock fetch with custom responses
   */
  mockFetch: (responses = {}) => {
    global.fetch = jest.fn((url, options) => {
      const method = options?.method || 'GET';
      const key = `${method} ${url}`;
      
      if (responses[key]) {
        return Promise.resolve(responses[key]);
      }
      
      if (responses[url]) {
        return Promise.resolve(responses[url]);
      }
      
      // Default response
      return Promise.resolve(testHelpers.createMockResponse({}));
    });
  },
};

// Export test categories for organized test running
export const testCategories = {
  unit: {
    pattern: '**/*.test.{js,jsx}',
    exclude: ['**/integration/**', '**/e2e/**'],
  },
  
  integration: {
    pattern: '**/integration/**/*.test.{js,jsx}',
  },
  
  components: {
    pattern: '**/components/**/*.test.{js,jsx}',
  },
  
  hooks: {
    pattern: '**/hooks/**/*.test.{js,jsx}',
  },
  
  contexts: {
    pattern: '**/contexts/**/*.test.{js,jsx}',
  },
  
  accessibility: {
    pattern: '**/*.a11y.test.{js,jsx}',
  },
  
  visual: {
    script: 'scripts/visual-regression.js',
  },
};

export default testConfig;