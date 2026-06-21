// Import Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const CACHE_VERSION = 'v2.0.1';
const CACHE_NAME = `nashty-pos-${CACHE_VERSION}`;

// Configure Workbox
workbox.setConfig({
  debug: false
});

// Precache app shell
workbox.precaching.precacheAndRoute([
  { url: './', revision: CACHE_VERSION },
  { url: './index.html', revision: CACHE_VERSION },
  { url: './css/components.css', revision: CACHE_VERSION },
  { url: './css/pos.css', revision: CACHE_VERSION },
  { url: './js/utils.js', revision: CACHE_VERSION },
  { url: './js/state.js', revision: CACHE_VERSION },
  { url: './js/printer.js', revision: CACHE_VERSION },
  { url: './js/auth.js', revision: CACHE_VERSION },
  { url: './js/app.js', revision: CACHE_VERSION },
  { url: './js/products.js', revision: CACHE_VERSION },
  { url: './js/cart.js', revision: CACHE_VERSION },
  { url: './js/modal.js', revision: CACHE_VERSION },
  { url: './js/orders.js', revision: CACHE_VERSION },
  { url: './js/history.js', revision: CACHE_VERSION },
  { url: './js/db-schema.js', revision: CACHE_VERSION },
  { url: './js/services/encryption-service.js', revision: CACHE_VERSION },
  { url: './js/services/cache-manager.js', revision: CACHE_VERSION },
  { url: './js/sync-manager.js', revision: CACHE_VERSION },
  { url: './manifest.json', revision: CACHE_VERSION }
]);

// Cache static assets (JS, CSS, fonts) - Cache First
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script' ||
                   request.destination === 'style' ||
                   request.destination === 'font',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-assets-' + CACHE_VERSION,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Cache images - Stale While Revalidate
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'images-' + CACHE_VERSION,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
      })
    ]
  })
);

// API calls - Network First with Background Sync
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('api-queue', {
  maxRetentionTime: 24 * 60 // Retry for 24 hours
});

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache-' + CACHE_VERSION,
    networkTimeoutSeconds: 10,
    plugins: [
      bgSyncPlugin,
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60 // 5 minutes
      })
    ]
  })
);

// Navigation requests - Network First, fallback to app shell
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'app-shell-' + CACHE_VERSION,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [200]
      })
    ]
  })
);

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !cacheName.includes(CACHE_VERSION))
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});

console.log('✅ Service Worker (Workbox) loaded - version', CACHE_VERSION);
