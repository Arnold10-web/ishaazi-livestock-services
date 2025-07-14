// Enhanced Core Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

class CoreWebVitalsTracker {
  constructor() {
    this.metrics = {};
    this.analyticsEndpoint = process.env.REACT_APP_ANALYTICS_ENDPOINT || '/api/analytics';
    this.setupTracking();
  }

  setupTracking() {
    // Track Cumulative Layout Shift
    getCLS((metric) => {
      this.metrics.cls = metric;
      this.reportMetric('CLS', metric);
    });

    // Track First Input Delay
    getFID((metric) => {
      this.metrics.fid = metric;
      this.reportMetric('FID', metric);
    });

    // Track First Contentful Paint
    getFCP((metric) => {
      this.metrics.fcp = metric;
      this.reportMetric('FCP', metric);
    });

    // Track Largest Contentful Paint
    getLCP((metric) => {
      this.metrics.lcp = metric;
      this.reportMetric('LCP', metric);
    });

    // Track Time to First Byte
    getTTFB((metric) => {
      this.metrics.ttfb = metric;
      this.reportMetric('TTFB', metric);
    });
  }

  reportMetric(name, metric) {
    // Only report in production
    if (process.env.NODE_ENV !== 'production') return;

    // Send to analytics endpoint
    fetch(this.analyticsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: name,
        value: metric.value,
        rating: metric.rating,
        path: window.location.pathname,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        connectionType: navigator.connection?.effectiveType,
        deviceMemory: navigator.deviceMemory
      })
    }).catch(err => console.warn('Analytics error:', err));

    // Log performance issues
    if (metric.rating === 'poor') {
      console.warn(`Poor ${name} performance:`, metric);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  // Performance budget warnings
  checkPerformanceBudget() {
    const budget = {
      LCP: 2500, // 2.5 seconds
      FID: 100,  // 100 milliseconds
      CLS: 0.1   // 0.1
    };

    const violations = [];
    Object.entries(budget).forEach(([metric, threshold]) => {
      const current = this.metrics[metric.toLowerCase()];
      if (current && current.value > threshold) {
        violations.push(`${metric}: ${current.value} > ${threshold}`);
      }
    });

    if (violations.length > 0) {
      console.warn('Performance budget violations:', violations);
    }

    return violations;
  }
}

export default CoreWebVitalsTracker;
