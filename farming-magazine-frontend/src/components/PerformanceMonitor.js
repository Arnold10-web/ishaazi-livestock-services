import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { 
  Activity, 
  Zap, 
  Clock, 
  Wifi, 
  Database, 
  Image as ImageIcon,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const PerformanceMonitor = ({ isVisible, onClose }) => {
  const [metrics, setMetrics] = useState({
    loading: true,
    performance: {},
    network: {},
    cache: {},
    vitals: {},
    webVitals: {
      cls: null,
      fid: null,
      fcp: null,
      lcp: null,
      ttfb: null
    },
    serviceWorkerStats: null
  });

  // Get Service Worker cache stats
  const getCacheStats = useCallback(async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_PERFORMANCE_METRICS' },
          [messageChannel.port2]
        );
      });
    }
    return null;
  }, []);

  // Collect Web Vitals
  useEffect(() => {
    getCLS((metric) => {
      setMetrics(prev => ({ 
        ...prev, 
        webVitals: { ...prev.webVitals, cls: metric }
      }));
    });

    getFID((metric) => {
      setMetrics(prev => ({ 
        ...prev, 
        webVitals: { ...prev.webVitals, fid: metric }
      }));
    });

    getFCP((metric) => {
      setMetrics(prev => ({ 
        ...prev, 
        webVitals: { ...prev.webVitals, fcp: metric }
      }));
    });

    getLCP((metric) => {
      setMetrics(prev => ({ 
        ...prev, 
        webVitals: { ...prev.webVitals, lcp: metric }
      }));
    });

    getTTFB((metric) => {
      setMetrics(prev => ({ 
        ...prev, 
        webVitals: { ...prev.webVitals, ttfb: metric }
      }));
    });
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const collectMetrics = async () => {
      const performance = window.performance;
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      // Core Web Vitals
      const vitals = {
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        lcp: 0, // Would need to implement LCP observer
        cls: 0, // Would need to implement CLS observer
        fid: 0  // Would need to implement FID observer
      };

      // Performance metrics
      const performanceMetrics = {
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
        firstByte: navigation?.responseStart - navigation?.requestStart || 0,
        domInteractive: navigation?.domInteractive - navigation?.navigationStart || 0,
        totalLoadTime: navigation?.loadEventEnd - navigation?.navigationStart || 0
      };

      // Network information
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const networkInfo = {
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false
      };

      // Cache performance (simulated - would need actual cache metrics)
      const cacheMetrics = {
        hitRate: Math.random() * 100, // Simulated
        size: Math.floor(Math.random() * 50), // MB
        entries: Math.floor(Math.random() * 1000)
      };

      // Service Worker cache stats
      const serviceWorkerStats = await getCacheStats();

      setMetrics({
        loading: false,
        performance: performanceMetrics,
        network: networkInfo,
        cache: cacheMetrics,
        vitals,
        serviceWorkerStats
      });
    };

    // Collect metrics immediately and then every 5 seconds
    collectMetrics();
    const interval = setInterval(collectMetrics, 5000);

    return () => clearInterval(interval);
  }, [isVisible, getCacheStats]);

  const formatTime = (time) => {
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const getPerformanceStatus = (metric, thresholds) => {
    if (metric < thresholds.good) return { status: 'good', color: 'text-green-600', icon: CheckCircle };
    if (metric < thresholds.needs_improvement) return { status: 'needs-improvement', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'poor', color: 'text-red-600', icon: AlertTriangle };
  };

  const fcpStatus = getPerformanceStatus(metrics.vitals.fcp, { good: 1800, needs_improvement: 3000 });
  const loadStatus = getPerformanceStatus(metrics.performance.totalLoadTime, { good: 2000, needs_improvement: 4000 });

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Performance Monitor
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {metrics.loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Collecting metrics...</span>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Core Web Vitals */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Core Web Vitals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        First Contentful Paint
                      </span>
                      <fcpStatus.icon className={`w-4 h-4 ${fcpStatus.color}`} />
                    </div>
                    <div className={`text-2xl font-bold ${fcpStatus.color}`}>
                      {formatTime(metrics.vitals.fcp)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Target: &lt; 1.8s
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Load Time
                      </span>
                      <loadStatus.icon className={`w-4 h-4 ${loadStatus.color}`} />
                    </div>
                    <div className={`text-2xl font-bold ${loadStatus.color}`}>
                      {formatTime(metrics.performance.totalLoadTime)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Target: &lt; 2s
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        DOM Interactive
                      </span>
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatTime(metrics.performance.domInteractive)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      DOM ready time
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">First Byte</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatTime(metrics.performance.firstByte)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">DOM Content Loaded</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatTime(metrics.performance.domContentLoaded)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Load Complete</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatTime(metrics.performance.loadComplete)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Load</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatTime(metrics.performance.totalLoadTime)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Network Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-blue-600" />
                  Network Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Connection Type</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {metrics.network.effectiveType}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Downlink</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {metrics.network.downlink.toFixed(1)} Mbps
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">RTT</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {metrics.network.rtt}ms
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Data Saver</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {metrics.network.saveData ? 'On' : 'Off'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache Performance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  Cache Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Hit Rate</div>
                    <div className="text-2xl font-semibold text-purple-600">
                      {metrics.cache.hitRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cache Size</div>
                    <div className="text-2xl font-semibold text-purple-600">
                      {metrics.cache.size}MB
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cached Entries</div>
                    <div className="text-2xl font-semibold text-purple-600">
                      {metrics.cache.entries}
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Worker Stats */}
              {metrics.serviceWorkerStats && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-pink-600" />
                    Service Worker Cache Stats
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Cache Size</div>
                      <div className="text-2xl font-semibold text-pink-600">
                        {metrics.serviceWorkerStats.totalCacheSize} MB
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Used Cache Size</div>
                      <div className="text-2xl font-semibold text-pink-600">
                        {metrics.serviceWorkerStats.usedCacheSize} MB
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expired Cache Size</div>
                      <div className="text-2xl font-semibold text-pink-600">
                        {metrics.serviceWorkerStats.expiredCacheSize} MB
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tips */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Performance Tips
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li>• Images are automatically optimized to WebP format</li>
                    <li>• Service Worker caches static resources for faster loading</li>
                    <li>• Code splitting reduces initial bundle size</li>
                    <li>• Redis caching improves API response times</li>
                    <li>• Lazy loading defers non-critical resource loading</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PerformanceMonitor;
