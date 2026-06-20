/**
 * NASHTY OS - Service Worker with Workbox
 * Provides offline-first caching with advanced strategies
 */

// Import Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const { registerRoute, setDefaultHandler, setCatchHandler } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;
const { BackgroundSyncPlugin } = workbox.backgroundSync;
const { precacheAndRoute } = workbox.precaching;

console.log('Workbox loaded:', workbox ? 'YES' : 'NO');

// Precache critical assets
const PRECACHE_ASSETS = [
  { url: '/pos/frontend/index.html', revision: '1.0.0' },
  { url: '/pos/frontend/css/components.css', revision: '1.0.0' },
  { url: '/pos/frontend/js/app.js', revision: '1.0.0' },
  { url: '/pos/frontend/js/auth.js', revision: '1.0.0' },
  { url: '/pos/frontend/js/cart.js', revision: '1.0.0' },
  { url: '/pos/frontend/js/state.js', revision: '1.0.0' },
  { url: '/pos/frontend/js/utils.js', revision: '1.0.0' },
  { url: '/pos/frontend/js/sync-manager.js', revision: '1.0.0' },
  { url: '/pos/frontend/js/db-schema.js', revision: '1.0.0' },
  { url: '/pos/frontend/js/services/encryption-service.js', revision: '1.0.0' },
  { url: '/pos/frontend/js/services/cache-manager.js', revision: '1.0.0' },
  { url: '/api-client.js', revision: '1.0.0' }
];

precacheAndRoute(PRECACHE_ASSETS);

// ── CACHING STRATEGIES ──

// Static assets: Cache First (HTML, CSS, JS, fonts)
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'font' ||
                   request.destination === 'document',
  new CacheFirst({
    cacheName: 'static-assets-v1',
    plugins: [
      new CacheableResponsePlugin({ 
        statuses: [0, 200] 
      }),
      new ExpirationPlugin({ 
        maxEntries: 60, 
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Product images: Stale While Revalidate
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images-v1',
    plugins: [
      new CacheableResponsePlugin({ 
        statuses: [0, 200] 
      }),
      new ExpirationPlugin({ 
        maxEntries: 200, 
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
      })
    ]
  })
);

// API calls: Network First with Background Sync
const bgSyncPlugin = new BackgroundSyncPlugin('orders-queue', {
  maxRetentionTime: 24 * 60 // Retry for up to 24 hours (in minutes)
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache-v1',
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({ 
        statuses: [0, 200] 
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutes
      }),
      bgSyncPlugin
    ]
  })
);

// ── EVENT HANDLERS ──

// Listen for skip waiting message (for updates)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('Service Worker: Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  const cacheWhitelist = [
    'static-assets-v1', 
    'images-v1', 
    'api-cache-v1',
    'workbox-precache-v2-' + self.location.origin
  ];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.some(name => cacheName.includes(name))) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// Installation event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});
