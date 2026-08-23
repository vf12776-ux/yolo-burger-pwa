const CACHE_NAME = 'yolo-burger-v2';
const urlsToCache = [
  '/yolo-burger-pwa/',
  '/yolo-burger-pwa/index.html',
  '/yolo-burger-pwa/style.css',
  '/yolo-burger-pwa/app.js',
  '/yolo-burger-pwa/manifest.json',
  '/yolo-burger-pwa/offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Активируем новый SW сразу
});

self.addEventListener('fetch', event => {
  // Игнорируем запросы не к нашему домену или не GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Есть в кэше - отдаем
        }
        // Нет в кэше - пробуем сеть
        return fetch(event.request).catch(() => {
          // Если сеть упала - отдаем офлайн-страницу (для навигации)
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
  self.clients.claim(); // Берем под контроль все открытые вкладки
});