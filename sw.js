const CACHE_NAME = 'looks-v7';

// Core assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles-data.json',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/assets/icons/apple-touch-icon.png'
];

// Install — cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for static assets, network-first for API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go network-first for API calls
  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'You appear to be offline. Please check your connection.' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache style images and JSON as they're fetched
        if (
          event.request.url.includes('/styles/') ||
          event.request.url.includes('styles-data.json')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
