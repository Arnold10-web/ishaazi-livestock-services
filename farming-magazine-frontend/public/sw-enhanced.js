// Enhanced Service Worker for Production
const CACHE_NAME = 'ishaazi-livestock-v1.3';
const STATIC_CACHE = 'static-v1.3';
const DYNAMIC_CACHE = 'dynamic-v1.3';
const API_CACHE = 'api-v1.3';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/images/ishaazi.jpg',
  '/offline.html',
  '/manifest.json'
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = {
  // Cache these API responses for 5 minutes
  shortCache: [
    '/api/content/blogs',
    '/api/content/news',
    '/api/content/events'
  ],
  // Cache these for 30 minutes
  longCache: [
    '/api/content/farms',
    '/api/content/basics'
  ],
  // Never cache these (always fresh)
  noCache: [
    '/api/auth/',
    '/api/admin/',
    '/api/user/profile'
  ]
};

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  images: 'cache-first',
  api: 'network-first',
  static: 'cache-first',
  documents: 'network-first'
};

// Performance monitoring
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  offlineRequests: 0
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(CRITICAL_RESOURCES))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => !cacheName.includes('v1.3'))
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests with intelligent caching
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request, url.pathname));
    return;
  }

  // Images - cache first with performance tracking
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // Static assets - cache first
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Documents - network first
  event.respondWith(networkFirstStrategy(request));
});

// Handle API requests with intelligent caching
async function handleApiRequest(request, pathname) {
  performanceMetrics.networkRequests++;

  // Check if this endpoint should never be cached
  if (API_CACHE_PATTERNS.noCache.some(pattern => pathname.includes(pattern))) {
    return fetch(request);
  }

  // Determine cache strategy based on endpoint
  let cacheTime = 0;
  if (API_CACHE_PATTERNS.longCache.some(pattern => pathname.includes(pattern))) {
    cacheTime = 30 * 60 * 1000; // 30 minutes
  } else if (API_CACHE_PATTERNS.shortCache.some(pattern => pathname.includes(pattern))) {
    cacheTime = 5 * 60 * 1000; // 5 minutes
  }

  if (cacheTime > 0) {
    return networkFirstWithTiming(request, API_CACHE, cacheTime);
  }

  return networkFirstStrategy(request);
}

// Network first with timing-based cache
async function networkFirstWithTiming(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(cacheName);
    
    // Add timestamp to response for cache invalidation
    const responseToCache = networkResponse.clone();
    const headers = new Headers(responseToCache.headers);
    headers.set('sw-cached-at', Date.now().toString());
    
    const modifiedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: headers
    });
    
    cache.put(request, modifiedResponse);
    performanceMetrics.cacheMisses++;
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cache is still valid
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt && (Date.now() - parseInt(cachedAt)) < maxAge) {
        performanceMetrics.cacheHits++;
        return cachedResponse;
      }
    }
    performanceMetrics.offlineRequests++;
    return caches.match('/offline.html');
  }
}

// Network first strategy with performance tracking
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    performanceMetrics.cacheMisses++;
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      performanceMetrics.cacheHits++;
      return cachedResponse;
    }
    performanceMetrics.offlineRequests++;
    return caches.match('/offline.html');
  }
}

// Cache first strategy with performance tracking
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
    performanceMetrics.cacheMisses++;
    return networkResponse;
  } catch (error) {
    performanceMetrics.offlineRequests++;
    return new Response('Resource not available offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle background sync
async function handleBackgroundSync() {
  // Handle any offline actions when connection is restored
  console.log('Background sync triggered');
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/images/ishaazi.jpg',
      badge: '/images/ishaazi.jpg',
      data: data.data,
      actions: [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Performance metrics endpoint for debugging
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_PERFORMANCE_METRICS') {
    event.ports[0].postMessage(performanceMetrics);
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
