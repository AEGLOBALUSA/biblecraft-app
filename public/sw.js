/**
 * VerseCraft Service Worker
 * Cache-first for static assets, network-first for API calls
 * Enables offline fallback and PWA installability
 */

const CACHE_NAME = 'versecraft-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/manifest.json',
];

const API_CACHE = 'versecraft-api-v1';

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // It's OK if some assets aren't available yet (e.g., during dev)
        console.log('Some static assets could not be cached during install');
      });
    })
  );
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch event - implement caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network-first, fall back to cache
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/auth/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets: cache-first, fall back to network
  if (
    request.method === 'GET' &&
    (url.pathname.match(/\.(js|css|png|jpg|svg|woff|woff2)$/) ||
      STATIC_ASSETS.includes(url.pathname))
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirst(request));
});

/**
 * Cache-first strategy: try cache, then network
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.log('Fetch failed, returning cached or offline fallback', err);
    return new Response('Offline - asset not cached', { status: 503 });
  }
}

/**
 * Network-first strategy: try network, then cache
 */
async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    console.log('Network request failed and no cache available', err);
    return new Response('Offline - API call failed', { status: 503 });
  }
}

/**
 * Background sync for offline actions (future enhancement)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncPlayerProgress());
  }
});

async function syncPlayerProgress() {
  // Placeholder for syncing player progress when coming back online
  console.log('Syncing player progress');
}

/**
 * Push notifications (future enhancement)
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'You have a new message',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'versecraft-notification',
  };

  event.waitUntil(self.registration.showNotification(data.title || 'VerseCraft', options));
});
