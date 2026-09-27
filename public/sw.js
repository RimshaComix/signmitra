const CACHE_NAME = 'signmitra-core-v2';

// Assets to cache immediately for complete offline usability
const ASSETS_TO_CACHE = [
  '/',
  '/globals.css',
  '/manifest.json',
  '/favicon.ico',
  '/communication-hub',
  '/steps',
  '/conversation',
  '/followups',
  '/history'
];

// Install Event - Pre-caches all the structural templates and UI pages
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SignMitra SW] Pre-caching core structural templates...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clears out old caches when building system updates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SignMitra SW] Clearing obsolete cache version:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic Cache-First Strategy for Offline-First operation
self.addEventListener('fetch', (event) => {
  // Only handle standard GET requests (ignore POST/API queries)
  if (event.request.method !== 'GET') return;
  
  if (event.request.mode === 'navigate' || event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached page instantly if found offline
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from network and dynamically cache the new resource
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        }).catch(() => {
          console.log('[SignMitra SW] Network failed and asset not in cache.');
        });
      })
    );
  }
});