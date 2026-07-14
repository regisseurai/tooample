/* TooAmple Studios — service worker
   Bump CACHE_VERSION whenever you push new files, so visitors get the update. */
const CACHE_VERSION = 'tooample-v5';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/book.html',
  '/academy.html',
  '/portfolio.html',
  '/services.html',
  '/packages.html',
  '/about.html',
  '/terms.html',
  '/styles.css',
  '/TooAmple-Rate-Card.pdf',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: pre-cache the core shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate: clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
//  - HTML pages: network-first (so updates show immediately), cache as fallback
//  - Everything else (css, images): cache-first, then network
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET requests from our own origin
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
