const CACHE_NAME = 'yolo-burger-v3'; // ВАЖНО: изменил на v3
const urlsToCache = [
  '/yolo-burger-pwa/',
  '/yolo-burger-pwa/index.html',
  '/yolo-burger-pwa/admin.html', // ДОБАВИЛ
  '/yolo-burger-pwa/style.css',
  '/yolo-burger-pwa/app.js',
  '/yolo-burger-pwa/admin.js', // ДОБАВИЛ
  '/yolo-burger-pwa/install-prompt.js', // ДОБАВИЛ
  '/yolo-burger-pwa/manifest.json',
  '/yolo-burger-pwa/admin-manifest.json', // ДОБАВИЛ
  '/yolo-burger-pwa/offline.html',
  '/yolo-burger-pwa/icons/icon-192.png',
  '/yolo-burger-pwa/icons/icon-512.png',
  '/yolo-burger-pwa/icons/icon35-192.png', // ДОБАВИЛ
  '/yolo-burger-pwa/icons/icon35-512.png' // ДОБАВИЛ
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/yolo-burger-pwa/offline.html');
          }
        });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});