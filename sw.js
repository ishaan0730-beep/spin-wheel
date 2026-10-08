// Spin & Wheel - Service Worker for PWA Mobile App Support
const CACHE_NAME = 'spin-wheel-v9.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './master.html',
  './master-manifest.json',
  './style.css',
  './app.js',
  './confetti.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './logo.png',
  './favicon.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Pass dynamic API / state calls directly to network
  if (e.request.url.includes('/api/') || e.request.method !== 'GET') {
    return;
  }
  // Network first with cache fallback
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});