// Spin & Wheel - Service Worker for PWA Mobile App Support
const CACHE_NAME = 'spin-wheel-v7.5.5';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './confetti.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './logo.png',
  './favicon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
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
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});