const CACHE_NAME = 'cogniviz-billing-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-icon-512.png'
];

// Install: Cache critical static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: Immediately purge all old caches from previous builds
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network-First for Navigation (HTML), Cache-First for static assets, Bypass for API
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Never intercept or cache API endpoints or file uploads
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads')) {
    return;
  }

  // 1. Navigation requests (Page loading / HTML): NETWORK FIRST
  // Always fetch fresh index.html from network so new hash bundles are picked up immediately.
  // Fall back to cached index.html only if completely offline.
  const isNavigation =
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Completely offline: serve cached shell
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 2. Static Assets (JS / CSS / Images / Fonts): Cache with Network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache successful static asset responses
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.startsWith('/assets/') || STATIC_ASSETS.includes(url.pathname))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});


