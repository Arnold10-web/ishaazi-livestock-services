// Performance optimization utilities for farming magazine

// Image lazy loading and optimization
export const optimizeImage = (src, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = 80,
    format = 'webp',
    fallback = 'jpg'
  } = options;

  // In production, this would integrate with an image optimization service
  // For now, we'll return the original with some basic optimizations
  if (!src) return '/images/placeholder.jpg';
  
  // Check if browser supports WebP
  const supportsWebP = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };

  // Return optimized image URL (mock implementation)
  const optimizedSrc = src.includes('http') 
    ? src 
    : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${src}`;

  return optimizedSrc;
};

// Lazy loading hook for images
export const useLazyLoading = (ref, options = {}) => {
  const { threshold = 0.1, rootMargin = '50px' } = options;

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.classList.remove('lazy');
              observer.unobserve(img);
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      const images = ref.current.querySelectorAll('img[data-src]');
      images.forEach((img) => observer.observe(img));
    }

    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);
};

// Debounce utility for search and scroll events
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle utility for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Cache management for API responses
class CacheManager {
  constructor(maxSize = 50, ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key, value) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item has expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const apiCache = new CacheManager();

// Enhanced fetch with caching and error handling
export const cachedFetch = async (url, options = {}) => {
  const { useCache = true, cacheKey, ...fetchOptions } = options;
  const key = cacheKey || url;

  // Try to get from cache first
  if (useCache) {
    const cached = apiCache.get(key);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Cache successful responses
    if (useCache && response.status === 200) {
      apiCache.set(key, data);
    }

    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// Performance monitoring
export const performanceMonitor = {
  // Measure page load time
  measurePageLoad: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart
      };
    }
    return null;
  },

  // Measure Core Web Vitals
  measureCoreWebVitals: () => {
    return new Promise((resolve) => {
      const vitals = {};

      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          vitals.fid = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        vitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // Return vitals after a delay to collect data
      setTimeout(() => resolve(vitals), 3000);
    });
  },

  // Log performance metrics
  logMetrics: (metrics) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('Performance Metrics');
      console.table(metrics);
      console.groupEnd();
    }

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics service
      // analytics.track('performance_metrics', metrics);
    }
  }
};

// Bundle size optimization helpers
export const loadComponentLazily = (importFunc) => {
  return React.lazy(() => 
    importFunc().then(module => ({
      default: module.default || module
    }))
  );
};

// Memory usage monitoring
export const memoryMonitor = {
  getCurrentUsage: () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  },

  startMonitoring: (interval = 30000) => {
    return setInterval(() => {
      const usage = memoryMonitor.getCurrentUsage();
      if (usage && usage.used > usage.limit * 0.8) {
        console.warn('High memory usage detected:', usage);
      }
    }, interval);
  }
};

// Network optimization
export const networkOptimizer = {
  // Preload critical resources
  preloadResource: (href, as = 'fetch', crossorigin = 'anonymous') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) link.crossOrigin = crossorigin;
    document.head.appendChild(link);
  },

  // Prefetch next page resources
  prefetchPage: (url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  },

  // Check connection quality
  getConnectionInfo: () => {
    if (navigator.connection) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    return null;
  }
};

// Error boundary for performance issues
export class PerformanceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Performance Error:', error, errorInfo);
    
    // Log to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // errorTracker.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            We're experiencing technical difficulties. Please refresh the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
