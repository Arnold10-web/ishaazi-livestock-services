/**
 * Mobile Optimization Utilities
 * Provides tools for optimizing mobile performance and user experience
 */

export class MobileOptimizer {
  constructor() {
    this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
    this.isTablet = /Tablet|iPad/i.test(navigator.userAgent);
    this.touchSupported = 'ontouchstart' in window;
    this.init();
  }

  init() {
    if (this.isMobile || this.isTablet) {
      this.optimizeForMobile();
    }
    this.setupTouchEvents();
    this.setupViewportOptimization();
  }

  /**
   * Apply mobile-specific optimizations
   */
  optimizeForMobile() {
    // Disable hover effects on touch devices
    if (this.touchSupported) {
      document.documentElement.classList.add('touch-device');
    }

    // Optimize touch targets
    this.optimizeTouchTargets();

    // Prevent zoom on input focus
    this.preventInputZoom();

    // Optimize image loading
    this.optimizeImageLoading();
  }

  /**
   * Ensure touch targets are at least 44px
   */
  optimizeTouchTargets() {
    const style = document.createElement('style');
    style.textContent = `
      .touch-device button,
      .touch-device a,
      .touch-device input,
      .touch-device textarea,
      .touch-device select {
        min-height: 44px;
        min-width: 44px;
      }
      
      .touch-device .btn-small {
        padding: 12px 16px;
        min-height: 44px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Prevent zoom on input focus for better UX
   */
  preventInputZoom() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
  }

  /**
   * Setup touch event optimizations
   */
  setupTouchEvents() {
    // Fast click handling
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });

    // Prevent double-tap zoom on specific elements
    document.addEventListener('dblclick', (e) => {
      if (e.target.matches('button, a, .no-zoom')) {
        e.preventDefault();
      }
    });
  }

  handleTouchStart(e) {
    this.touchStartTime = Date.now();
    this.touchTarget = e.target;
  }

  handleTouchEnd(e) {
    const touchDuration = Date.now() - this.touchStartTime;
    
    // Quick tap (< 200ms) - add visual feedback
    if (touchDuration < 200 && this.touchTarget === e.target) {
      this.addTouchFeedback(e.target);
    }
  }

  addTouchFeedback(element) {
    element.classList.add('touch-feedback');
    setTimeout(() => {
      element.classList.remove('touch-feedback');
    }, 150);
  }

  /**
   * Optimize image loading for mobile
   */
  optimizeImageLoading() {
    // Lazy loading for images
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }

    // WebP support detection
    this.detectWebPSupport();
  }

  detectWebPSupport() {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      if (webP.height === 2) {
        document.documentElement.classList.add('webp-supported');
      }
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  }

  /**
   * Setup viewport optimization
   */
  setupViewportOptimization() {
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.adjustViewportForOrientation();
      }, 100);
    });

    // Handle safe area insets (for iOS)
    this.setupSafeAreaSupport();
  }

  adjustViewportForOrientation() {
    // Recalculate viewport height accounting for mobile browser bars
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  setupSafeAreaSupport() {
    const style = document.createElement('style');
    style.textContent = `
      .safe-area-top {
        padding-top: env(safe-area-inset-top);
      }
      
      .safe-area-bottom {
        padding-bottom: env(safe-area-inset-bottom);
      }
      
      .safe-area-left {
        padding-left: env(safe-area-inset-left);
      }
      
      .safe-area-right {
        padding-right: env(safe-area-inset-right);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Check if device is in landscape mode
   */
  isLandscape() {
    return window.innerWidth > window.innerHeight;
  }

  /**
   * Get device type information
   */
  getDeviceInfo() {
    return {
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      touchSupported: this.touchSupported,
      isLandscape: this.isLandscape(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }

  /**
   * Add mobile-specific CSS classes
   */
  addMobileClasses() {
    const classes = [];
    
    if (this.isMobile) classes.push('mobile');
    if (this.isTablet) classes.push('tablet');
    if (this.touchSupported) classes.push('touch');
    if (this.isLandscape()) classes.push('landscape');
    else classes.push('portrait');
    
    document.documentElement.classList.add(...classes);
  }
}

/**
 * Performance optimizations for mobile
 */
export class MobilePerformanceOptimizer {
  constructor() {
    this.setupReducedAnimations();
    this.setupBatteryOptimization();
    this.setupNetworkOptimization();
  }

  setupReducedAnimations() {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
      document.documentElement.classList.add('reduced-motion');
    }

    prefersReducedMotion.addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }
    });
  }

  setupBatteryOptimization() {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        if (battery.level < 0.2) {
          document.documentElement.classList.add('low-battery');
          this.enablePowerSaveMode();
        }

        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2) {
            document.documentElement.classList.add('low-battery');
            this.enablePowerSaveMode();
          } else {
            document.documentElement.classList.remove('low-battery');
          }
        });
      });
    }
  }

  enablePowerSaveMode() {
    // Reduce animation frequency
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    
    // Disable non-essential features
    const style = document.createElement('style');
    style.textContent = `
      .low-battery * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
      
      .low-battery .parallax,
      .low-battery .particle-effect {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  setupNetworkOptimization() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        document.documentElement.classList.add('slow-connection');
        this.enableLowBandwidthMode();
      }

      connection.addEventListener('change', () => {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          document.documentElement.classList.add('slow-connection');
          this.enableLowBandwidthMode();
        } else {
          document.documentElement.classList.remove('slow-connection');
        }
      });
    }
  }

  enableLowBandwidthMode() {
    // Disable autoplay videos
    document.querySelectorAll('video[autoplay]').forEach(video => {
      video.removeAttribute('autoplay');
    });

    // Use lower quality images
    document.querySelectorAll('img').forEach(img => {
      if (img.dataset.lowSrc) {
        img.src = img.dataset.lowSrc;
      }
    });
  }
}

// Initialize mobile optimizations
export const initializeMobileOptimizations = () => {
  const mobileOptimizer = new MobileOptimizer();
  const performanceOptimizer = new MobilePerformanceOptimizer();
  
  mobileOptimizer.addMobileClasses();
  
  return {
    mobileOptimizer,
    performanceOptimizer
  };
};

export default MobileOptimizer;
