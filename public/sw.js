const CACHE_NAME = 'consensus-vault-v1';
const urlsToCache = [
  '/',
  '/favicon.svg',
  '/manifest.json',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests (like HEAD requests that cause ERR_ABORTED)
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip API routes - don't cache or intercept
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Skip SSE/streaming endpoints
  if (event.request.headers.get('accept')?.includes('text/event-stream')) {
    return;
  }
  
  // Skip _next/static files - Next.js handles these
  if (event.request.url.includes('/_next/static/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).catch((error) => {
          console.log('Fetch failed:', error);
          // Return nothing for failed requests (don't break the page)
          return new Response('', { status: 408, statusText: 'Request Timeout' });
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});
