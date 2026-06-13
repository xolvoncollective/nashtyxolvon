const CACHE_NAME = 'nashty-pos-v6';
const ASSETS = [
  './',
  './index.html',
  './css/components.css',
  './css/pos.css',
  './js/utils.js',
  './js/state.js',
  './js/printer.js',
  './js/auth.js',
  './js/app.js',
  './js/products.js',
  './js/cart.js',
  './js/modal.js',
  './js/orders.js',
  './js/history.js',
  './manifest.json',
  '../api-client.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) {
    // API calls: Network first, fallback to cached data if possible, else fail
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open('nashty-api-cache').then(cache => {
            cache.put(e.request, clone);
          });
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Static assets: Network first, fallback to cache for development
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, clone);
          });
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
