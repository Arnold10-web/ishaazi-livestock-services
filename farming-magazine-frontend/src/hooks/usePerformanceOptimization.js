import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for performance optimization
 * Provides utilities for lazy loading, prefetching, and performance monitoring
 */
const usePerformanceOptimization = () => {
  const observerRef = useRef(null);
  const prefetchedUrls = useRef(new Set());

  // Initialize Intersection Observer for lazy loading
  useEffect(() => {
    if (!window.IntersectionObserver) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target;
            
            // Handle lazy loading images
            if (element.dataset.src) {
              element.src = element.dataset.src;
              element.removeAttribute('data-src');
              observerRef.current.unobserve(element);
            }
            
            // Handle lazy loading components
            if (element.dataset.component) {
              const event = new CustomEvent('lazyload', {
                detail: { component: element.dataset.component }
              });
              element.dispatchEvent(event);
              observerRef.current.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Lazy load images
  const lazyLoadImage = useCallback((imageElement) => {
    if (observerRef.current && imageElement) {
      observerRef.current.observe(imageElement);
    }
  }, []);

  // Prefetch resources
  const prefetchResource = useCallback((url, type = 'fetch') => {
    if (prefetchedUrls.current.has(url)) return;
    
    prefetchedUrls.current.add(url);
    
    try {
      if (type === 'fetch') {
        // Prefetch API data
        fetch(url, { 
          method: 'GET',
          headers: { 'Cache-Control': 'max-age=300' }
        }).catch(() => {
          // Silently fail for prefetch
          prefetchedUrls.current.delete(url);
        });
      } else if (type === 'link') {
        // Prefetch page resources
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.onload = () => document.head.removeChild(link);
        link.onerror = () => {
          document.head.removeChild(link);
          prefetchedUrls.current.delete(url);
        };
        document.head.appendChild(link);
      }
    } catch (error) {
      console.warn('Prefetch failed:', error);
      prefetchedUrls.current.delete(url);
    }
  }, []);

  // Preload critical resources
  const preloadResource = useCallback((url, type = 'script') => {
    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = type;
      
      if (type === 'font') {
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  }, []);

  // Optimize images
  const optimizeImage = useCallback((src, options = {}) => {
    const {
      width = 800,
      height = 600,
      quality = 80,
      format = 'webp'
    } = options;

    // Check if browser supports WebP
    const supportsWebP = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })();

    if (!supportsWebP && format === 'webp') {
      return src; // Return original if WebP not supported
    }

    // If it's already optimized or external URL, return as is
    if (src.includes('?') || src.startsWith('http')) {
      return src;
    }

    // Add optimization parameters
    const params = new URLSearchParams({
      w: width,
      h: height,
      q: quality,
      f: format
    });

    return `${src}?${params.toString()}`;
  }, []);

  // Debounce function for performance
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Throttle function for performance
  const throttle = useCallback((func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  // Measure performance
  const measurePerformance = useCallback((name, fn) => {
    return async (...args) => {
      const start = performance.now();
      try {
        const result = await fn(...args);
        const end = performance.now();
        console.log(`Performance: ${name} took ${end - start} milliseconds`);
        return result;
      } catch (error) {
        const end = performance.now();
        console.error(`Performance: ${name} failed after ${end - start} milliseconds`, error);
        throw error;
      }
    };
  }, []);

  // Check if user prefers reduced motion
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Check connection quality
  const getConnectionQuality = useCallback(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) return 'unknown';
    
    const { effectiveType, downlink, rtt } = connection;
    
    return {
      type: effectiveType,
      downlink: downlink || 0,
      rtt: rtt || 0,
      slow: effectiveType === 'slow-2g' || effectiveType === '2g',
      fast: effectiveType === '4g' && downlink > 1.5
    };
  }, []);

  // Adaptive loading based on connection
  const adaptiveLoad = useCallback((fastContent, slowContent) => {
    const connection = getConnectionQuality();
    
    if (connection.slow) {
      return slowContent;
    }
    
    return fastContent;
  }, [getConnectionQuality]);

  // Memory usage monitoring
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = performance.memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }, []);

  // Clean up resources
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    prefetchedUrls.current.clear();
  }, []);

  // Service Worker utilities
  const serviceWorkerUtils = {
    register: async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
          return registration;
        } catch (error) {
          console.error('Service Worker registration failed:', error);
          return null;
        }
      }
      return null;
    },
    
    update: async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.update();
        }
      }
    },
    
    skipWaiting: () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
      }
    }
  };

  return {
    lazyLoadImage,
    prefetchResource,
    preloadResource,
    optimizeImage,
    debounce,
    throttle,
    measurePerformance,
    prefersReducedMotion,
    getConnectionQuality,
    adaptiveLoad,
    getMemoryUsage,
    cleanup,
    serviceWorkerUtils
  };
};

export default usePerformanceOptimization;
