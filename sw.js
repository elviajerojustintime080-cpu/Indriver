const CACHE_NAME = 'ruta-costa-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('tile.openstreetmap.org')) {
    e.respondWith(
      caches.open('osm-tiles').then((cache) =>
        cache.match(e.request).then((res) => {
          return (
            res ||
            fetch(e.request)
              .then((networkRes) => {
                cache.put(e.request, networkRes.clone());
                return networkRes;
              })
              .catch(() => caches.match('/fallback-tile.png'))
          );
        })
      )
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});