import React, { useState, useEffect } from 'react';

const PerformanceDashboard = ({ darkMode = false }) => {
  const [metrics, setMetrics] = useState({
    pageLoadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
    timeToInteractive: 0,
    resourceCounts: {
      images: 0,
      scripts: 0,
      stylesheets: 0,
      xhr: 0
    },
    cacheHitRate: 0,
    bundleSize: 0
  });

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        updateMetrics(entry);
      }
    });

    // Observe various performance metrics
    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
    } catch (e) {
      console.warn('Some performance metrics not supported:', e.message);
    }

    // Get Web Vitals
    collectWebVitals();

    // Monitor resource loading
    monitorResources();

    return () => observer.disconnect();
  }, []);

  const updateMetrics = (entry) => {
    setMetrics(prev => {
      const newMetrics = { ...prev };

      switch (entry.entryType) {
        case 'navigation':
          newMetrics.pageLoadTime = entry.loadEventEnd - entry.loadEventStart;
          newMetrics.timeToInteractive = entry.domInteractive - entry.navigationStart;
          break;
        case 'paint':
          if (entry.name === 'first-contentful-paint') {
            newMetrics.firstContentfulPaint = entry.startTime;
          }
          break;
        case 'largest-contentful-paint':
          newMetrics.largestContentfulPaint = entry.startTime;
          break;
        case 'layout-shift':
          if (!entry.hadRecentInput) {
            newMetrics.cumulativeLayoutShift += entry.value;
          }
          break;
        case 'first-input':
          newMetrics.firstInputDelay = entry.processingStart - entry.startTime;
          break;
        default:
          // Handle unknown entry types gracefully
          console.debug('Unknown performance entry type:', entry.entryType);
          break;
      }

      return newMetrics;
    });
  };

  const collectWebVitals = () => {
    // Use web-vitals library if available
    if (window.webVitals) {
      window.webVitals.getFCP(metric => {
        setMetrics(prev => ({ ...prev, firstContentfulPaint: metric.value }));
      });
      
      window.webVitals.getLCP(metric => {
        setMetrics(prev => ({ ...prev, largestContentfulPaint: metric.value }));
      });
      
      window.webVitals.getCLS(metric => {
        setMetrics(prev => ({ ...prev, cumulativeLayoutShift: metric.value }));
      });
      
      window.webVitals.getFID(metric => {
        setMetrics(prev => ({ ...prev, firstInputDelay: metric.value }));
      });
    }
  };

  const monitorResources = () => {
    const resources = performance.getEntriesByType('resource');
    const counts = {
      images: 0,
      scripts: 0,
      stylesheets: 0,
      xhr: 0
    };

    let totalSize = 0;

    resources.forEach(resource => {
      totalSize += resource.transferSize || 0;
      
      if (resource.initiatorType === 'img') counts.images++;
      else if (resource.initiatorType === 'script') counts.scripts++;
      else if (resource.initiatorType === 'link') counts.stylesheets++;
      else if (resource.initiatorType === 'xmlhttprequest' || resource.initiatorType === 'fetch') counts.xhr++;
    });

    setMetrics(prev => ({
      ...prev,
      resourceCounts: counts,
      bundleSize: Math.round(totalSize / 1024) // Convert to KB
    }));
  };

  const getScoreColor = (metric, thresholds) => {
    if (metric <= thresholds.good) return 'text-green-600';
    if (metric <= thresholds.needs_improvement) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (time) => {
    return time < 1000 ? `${Math.round(time)}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  const MetricCard = ({ title, value, unit, thresholds, description }) => (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 rounded-lg shadow border`}>
      <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{title}</h3>
      <div className={`text-2xl font-bold ${thresholds ? getScoreColor(value, thresholds) : darkMode ? 'text-white' : 'text-gray-900'}`}>
        {typeof value === 'number' ? 
          (unit === 'time' ? formatTime(value) : 
           unit === 'percent' ? `${(value * 100).toFixed(2)}%` :
           unit === 'kb' ? `${value}KB` :
           Math.round(value * 1000) / 1000) : 
          value}
      </div>
      {description && <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{description}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🚀 Performance Dashboard
          </h2>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Real-time performance metrics and Web Vitals monitoring
          </p>
        </div>
        <div className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} px-3 py-1 rounded-full text-sm font-medium`}>
          <i className="fas fa-tachometer-alt mr-1"></i>
          Live Monitoring
        </div>
      </div>

      {/* Core Web Vitals */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          📊 Core Web Vitals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <MetricCard
            title="First Contentful Paint"
            value={metrics.firstContentfulPaint}
            unit="time"
            thresholds={{ good: 1800, needs_improvement: 3000 }}
            description="Time to first content render"
          />
          
          <MetricCard
            title="Largest Contentful Paint"
            value={metrics.largestContentfulPaint}
            unit="time"
            thresholds={{ good: 2500, needs_improvement: 4000 }}
            description="Time to largest content render"
          />
          
          <MetricCard
            title="Cumulative Layout Shift"
            value={metrics.cumulativeLayoutShift}
            thresholds={{ good: 0.1, needs_improvement: 0.25 }}
            description="Visual stability score"
          />
          
          <MetricCard
            title="First Input Delay"
            value={metrics.firstInputDelay}
            unit="time"
            thresholds={{ good: 100, needs_improvement: 300 }}
            description="Time to first interaction"
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          🔧 Technical Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Time to Interactive"
            value={metrics.timeToInteractive}
            unit="time"
            description="Time until fully interactive"
          />
          
          <MetricCard
            title="Bundle Size"
            value={metrics.bundleSize}
            unit="kb"
            description="Total transferred size"
          />
          
          <MetricCard
            title="Images Loaded"
            value={metrics.resourceCounts.images}
            description="Number of image resources"
          />
          
          <MetricCard
            title="Scripts Loaded"
            value={metrics.resourceCounts.scripts}
            description="Number of JavaScript files"
          />
        </div>
      </div>

      {/* Performance Insights */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow border`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          💡 Performance Insights & Optimizations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-green-600 mb-3 flex items-center">
              <i className="fas fa-check-circle mr-2"></i>
              Applied Optimizations
            </h4>
            <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-center">
                <i className="fas fa-bolt text-yellow-500 mr-2 w-4"></i>
                Code splitting and lazy loading
              </li>
              <li className="flex items-center">
                <i className="fas fa-image text-blue-500 mr-2 w-4"></i>
                Image optimization with WebP
              </li>
              <li className="flex items-center">
                <i className="fas fa-memory text-red-500 mr-2 w-4"></i>
                Redis caching implemented
              </li>
              <li className="flex items-center">
                <i className="fas fa-database text-green-500 mr-2 w-4"></i>
                Database indexing optimized
              </li>
              <li className="flex items-center">
                <i className="fas fa-chart-line text-purple-500 mr-2 w-4"></i>
                Bundle size monitoring
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-600 mb-3 flex items-center">
              <i className="fas fa-target mr-2"></i>
              Performance Targets
            </h4>
            <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex justify-between">
                <span>First Contentful Paint:</span>
                <span className="font-medium text-green-600">&lt; 1.8s</span>
              </li>
              <li className="flex justify-between">
                <span>Largest Contentful Paint:</span>
                <span className="font-medium text-green-600">&lt; 2.5s</span>
              </li>
              <li className="flex justify-between">
                <span>Cumulative Layout Shift:</span>
                <span className="font-medium text-green-600">&lt; 0.1</span>
              </li>
              <li className="flex justify-between">
                <span>First Input Delay:</span>
                <span className="font-medium text-green-600">&lt; 100ms</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
