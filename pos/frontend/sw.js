/**
 * Nashty POS Service Worker
 * Handles offline functionality using Workbox
 */

// Import Workbox from CDN (production-ready)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const { precacheAndRoute } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;

// Service Worker version
const SW_VERSION = '1.0.0';
const CACHE_PREFIX = 'nashty-pos';

console.log(`🚀 Nashty POS Service Worker v${SW_VERSION} starting...`);

// =====================================================
// CACHE CONFIGURATION
// =====================================================

const CACHES = {
  STATIC: `${CACHE_PREFIX}-static-v${SW_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-v${SW_VERSION}`,
  API: `${CACHE_PREFIX}-api-v${SW_VERSION}`,
  FONTS: `${CACHE_PREFIX}-fonts-v${SW_VERSION}`,
};

// =====================================================
// PRECACHE STATIC ASSETS
// =====================================================

// Precache essential POS files
precacheAndRoute([
  { url: '/pos/frontend/index.html', revision: SW_VERSION },
  { url: '/pos/frontend/css/main.css', revision: SW_VERSION },
  { url: '/pos/frontend/js/main.js', revision: SW_VERSION },
  { url: '/pos/frontend/js/api.js', revision: SW_VERSION },
  { url: '/pos/frontend/js/auth.js', revision: SW_VERSION },
  { url: '/pos/frontend/js/orders.js', revision: SW_VERSION },
  { url: '/pos/frontend/services/db-schema.js', revision: SW_VERSION },
  { url: '/index.html', revision: SW_VERSION },
]);

// =====================================================
// ROUTING STRATEGIES
// =====================================================

// 1. Static Assets (HTML, CSS, JS) - Cache First
registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'document',
  new CacheFirst({
    cacheName: CACHES.STATIC,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// 2. Images - Cache First with expiration
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHES.IMAGES,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// 3. Fonts - Cache First (long cache)
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: CACHES.FONTS,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// 4. API Calls (Supabase) - Network First with fallback
registerRoute(
  ({ url }) => 
    url.origin === 'https://mzucfndifneytbesirkx.supabase.co' ||
    url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: CACHES.API,
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// 5. Products/Categories API - Stale While Revalidate
registerRoute(
  ({ url }) => 
    url.pathname.includes('/products') ||
    url.pathname.includes('/categories') ||
    url.pathname.includes('/menu'),
  new StaleWhileRevalidate({
    cacheName: CACHES.API,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 15 * 60, // 15 minutes
      }),
    ],
  })
);

// =====================================================
// OFFLINE FALLBACK
// =====================================================

// Fallback for navigation requests when offline
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      return await fetch(event.request);
    } catch (error) {
      // Return cached page or offline page
      const cache = await caches.open(CACHES.STATIC);
      const cachedResponse = await cache.match('/pos/frontend/index.html');
      return cachedResponse || new Response('Offline - Please reconnect', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }
);

// =====================================================
// SERVICE WORKER LIFECYCLE EVENTS
// =====================================================

// Install Event
self.addEventListener('install', (event) => {
  console.log('✓ Service Worker installing...');
  // Force waiting SW to become active immediately
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('✓ Service Worker activating...');
  
  // Clean up old caches
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.startsWith(CACHE_PREFIX) && 
        !Object.values(CACHES).includes(name)
      );
      
      await Promise.all(
        oldCaches.map(cacheName => {
          console.log(`Deleting old cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
      
      // Take control of all clients immediately
      await self.clients.claim();
      console.log('✅ Service Worker activated and claimed clients');
    })()
  );
});

// Message Event (for skip waiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

// Fetch Event (handled by Workbox routes above, but add logging)
self.addEventListener('fetch', (event) => {
  // Log API requests for debugging (can be removed in production)
  if (event.request.url.includes('supabase.co')) {
    console.log(`📡 API Request: ${event.request.method} ${event.request.url}`);
  }
});

// =====================================================
// BACKGROUND SYNC (Future Enhancement)
// =====================================================

// Register background sync for offline orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-orders') {
    console.log('🔄 Background sync triggered: sync-offline-orders');
    event.waitUntil(syncOfflineOrders());
  }
});

async function syncOfflineOrders() {
  try {
    // Open IndexedDB and get pending orders
    // This will be implemented with the Sync Manager (Task 6)
    console.log('Syncing offline orders...');
    // TODO: Implement actual sync logic in Task 6
    return true;
  } catch (error) {
    console.error('Failed to sync offline orders:', error);
    throw error;
  }
}

// =====================================================
// PUSH NOTIFICATIONS (Future Enhancement)
// =====================================================

self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'Nashty POS';
  const options = {
    body: data.body || 'New notification',
    icon: '/pos/frontend/icons/icon-192x192.png',
    badge: '/pos/frontend/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data,
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/pos/frontend/')
  );
});

console.log('✅ Service Worker fully initialized');
