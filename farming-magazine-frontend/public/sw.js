const CACHE_NAME = 'farming-magazine-v1';
const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/news/,
  /\/api\/blogs/,
  /\/api\/farms/,
  /\/api\/search/
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|svg)$/,
  /\/uploads\/images\//
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip requests to different origins (except for same-origin API calls)
  if (url.origin !== location.origin && !url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Static resources - Cache First strategy
  if (STATIC_RESOURCES.includes(url.pathname)) {
    return cacheFirst(request, STATIC_CACHE);
  }
  
  // API requests - Network First with cache fallback
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return networkFirst(request, DYNAMIC_CACHE);
  }
  
  // Images - Cache First with network fallback
  if (IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return cacheFirst(request, DYNAMIC_CACHE);
  }
  
  // HTML pages - Network First with cache fallback
  if (request.headers.get('accept').includes('text/html')) {
    return networkFirst(request, DYNAMIC_CACHE);
  }
  
  // Default - Network First
  return networkFirst(request, DYNAMIC_CACHE);
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Cache hit for', request.url);
      return cachedResponse;
    }
    
    console.log('Service Worker: Cache miss, fetching from network', request.url);
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Cache first failed', error);
    return getOfflinePage(request);
  }
}

// Network First strategy
async function networkFirst(request, cacheName) {
  try {
    console.log('Service Worker: Network first for', request.url);
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseClone = networkResponse.clone();
      
      // Limit cache size by removing old entries
      await limitCacheSize(cache, 50);
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Cache fallback hit for', request.url);
      return cachedResponse;
    }
    
    return getOfflinePage(request);
  }
}

// Get offline page for failed requests
async function getOfflinePage(request) {
  const url = new URL(request.url);
  
  // Return offline page for HTML requests
  if (request.headers.get('accept').includes('text/html')) {
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/offline.html');
    
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // Return a basic offline response
  return new Response(
    JSON.stringify({ 
      error: 'Offline', 
      message: 'This content is not available offline' 
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Limit cache size to prevent storage overflow
async function limitCacheSize(cache, maxSize) {
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
    console.log(`Service Worker: Deleted ${keysToDelete.length} old cache entries`);
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Get stored offline actions
    const actions = await getStoredActions();
    
    for (const action of actions) {
      try {
        await executeAction(action);
        await removeStoredAction(action.id);
        console.log('Service Worker: Synced offline action', action.id);
      } catch (error) {
        console.error('Service Worker: Failed to sync action', action.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New content available!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Content',
        icon: '/icon-view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Farming Magazine', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_CLEAR') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// Helper functions for offline storage
async function getStoredActions() {
  // Implementation depends on your offline storage strategy
  // Could use IndexedDB or localStorage
  return [];
}

async function removeStoredAction(actionId) {
  // Remove the action from storage after successful sync
}

async function executeAction(action) {
  // Execute the stored offline action
  const response = await fetch(action.url, {
    method: action.method,
    headers: action.headers,
    body: action.body
  });
  
  if (!response.ok) {
    throw new Error(`Action failed: ${response.status}`);
  }
  
  return response;
}
