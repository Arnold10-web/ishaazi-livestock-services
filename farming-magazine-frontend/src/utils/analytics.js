// Enhanced Analytics and User Engagement Tracking
class AnalyticsManager {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.events = [];
    this.userEngagement = {
      pageViews: 0,
      timeOnPage: 0,
      scrollDepth: 0,
      interactions: 0,
      adClicks: 0,
      articleShares: 0,
      searchQueries: 0
    };
    this.init();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  init() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', { timestamp: Date.now() });
      } else {
        this.trackEvent('page_visible', { timestamp: Date.now() });
      }
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        this.userEngagement.scrollDepth = maxScrollDepth;
        
        // Track milestone scroll depths
        if ([25, 50, 75, 90].includes(scrollPercent)) {
          this.trackEvent('scroll_milestone', { depth: scrollPercent });
        }
      }
    };

    window.addEventListener('scroll', this.throttle(trackScroll, 1000));

    // Track time on page
    setInterval(() => {
      if (!document.hidden) {
        this.userEngagement.timeOnPage += 1;
      }
    }, 1000);

    // Track clicks and interactions
    document.addEventListener('click', (e) => {
      this.userEngagement.interactions++;
      
      // Track specific element types
      const tagName = e.target.tagName.toLowerCase();
      const className = e.target.className || '';
      const classNameStr = typeof className === 'string' ? className : className.toString();
      
      if (tagName === 'a') {
        this.trackEvent('link_click', {
          href: e.target.href,
          text: e.target.textContent.trim().substring(0, 50)
        });
      }
      
      if (classNameStr.includes('ad-') || classNameStr.includes('advertisement')) {
        this.userEngagement.adClicks++;
        this.trackEvent('ad_click', {
          adType: classNameStr,
          position: this.getElementPosition(e.target)
        });
      }
    });
  }

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  trackEvent(eventName, data = {}) {
    const event = {
      id: this.generateEventId(),
      sessionId: this.sessionId,
      eventName,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...data
    };

    this.events.push(event);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }

    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(event);
    }
  }

  generateEventId() {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  sendToAnalytics(event) {
    // In production, send to your analytics service
    // Example: Google Analytics, Mixpanel, custom analytics API
    try {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      }).catch(err => console.warn('Analytics tracking failed:', err));
    } catch (error) {
      console.warn('Analytics error:', error);
    }
  }

  // Track specific farming magazine events
  trackArticleView(articleId, category, title) {
    this.userEngagement.pageViews++;
    this.trackEvent('article_view', {
      articleId,
      category,
      title: title.substring(0, 100),
      referrer: document.referrer
    });
  }

  trackArticleShare(articleId, platform, title) {
    this.userEngagement.articleShares++;
    this.trackEvent('article_share', {
      articleId,
      platform,
      title: title.substring(0, 100)
    });
  }

  trackSearch(query, results, category = null) {
    this.userEngagement.searchQueries++;
    this.trackEvent('search', {
      query: query.substring(0, 100),
      resultsCount: results,
      category
    });
  }

  trackAdImpression(adId, position, category) {
    this.trackEvent('ad_impression', {
      adId,
      position,
      category,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  trackFormSubmission(formType, success = true) {
    this.trackEvent('form_submission', {
      formType,
      success,
      timeToComplete: Date.now() - this.startTime
    });
  }

  trackError(error, context = {}) {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context
    });
  }

  // Get user engagement score (0-100)
  getEngagementScore() {
    const weights = {
      timeOnPage: 0.3,
      scrollDepth: 0.2,
      interactions: 0.2,
      pageViews: 0.1,
      articleShares: 0.1,
      searchQueries: 0.1
    };

    const normalizedMetrics = {
      timeOnPage: Math.min(this.userEngagement.timeOnPage / 300, 1), // 5 minutes max
      scrollDepth: this.userEngagement.scrollDepth / 100,
      interactions: Math.min(this.userEngagement.interactions / 20, 1), // 20 interactions max
      pageViews: Math.min(this.userEngagement.pageViews / 10, 1), // 10 pages max
      articleShares: Math.min(this.userEngagement.articleShares / 5, 1), // 5 shares max
      searchQueries: Math.min(this.userEngagement.searchQueries / 5, 1) // 5 searches max
    };

    let score = 0;
    Object.keys(weights).forEach(metric => {
      score += normalizedMetrics[metric] * weights[metric];
    });

    return Math.round(score * 100);
  }

  // Get session summary
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      engagementScore: this.getEngagementScore(),
      metrics: { ...this.userEngagement },
      eventsCount: this.events.length,
      lastActivity: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : this.startTime
    };
  }

  // Export data for analysis
  exportData() {
    return {
      session: this.getSessionSummary(),
      events: this.events,
      userAgent: navigator.userAgent,
      screenResolution: {
        width: window.screen.width,
        height: window.screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }
}

// Create global analytics instance
export const analytics = new AnalyticsManager();

// React hook for analytics
export const useAnalytics = () => {
  const trackPageView = (path, title) => {
    analytics.trackEvent('page_view', { path, title });
  };

  const trackClick = (element, context = {}) => {
    analytics.trackEvent('click', { element, context });
  };

  const trackCustomEvent = (eventName, data = {}) => {
    analytics.trackEvent(eventName, data);
  };

  return {
    trackPageView,
    trackClick,
    trackCustomEvent,
    getEngagementScore: () => analytics.getEngagementScore(),
    getSessionSummary: () => analytics.getSessionSummary()
  };
};

// Performance analytics
export const performanceAnalytics = {
  trackLoadTime: (componentName, loadTime) => {
    analytics.trackEvent('component_load_time', {
      componentName,
      loadTime,
      isSlowLoad: loadTime > 1000
    });
  },

  trackApiCall: (endpoint, duration, success = true) => {
    analytics.trackEvent('api_call', {
      endpoint,
      duration,
      success,
      isSlow: duration > 2000
    });
  },

  trackImageLoad: (src, loadTime, success = true) => {
    analytics.trackEvent('image_load', {
      src: src.substring(0, 100),
      loadTime,
      success,
      isSlow: loadTime > 3000
    });
  }
};

export default analytics;
