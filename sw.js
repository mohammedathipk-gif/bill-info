const CACHE_NAME = 'quickbite-v1';
const APP_FILES = ['./', './index.html', './css/styles.css', './js/data.js', './js/storage.js', './js/billing.js', './js/orders.js', './js/app.js', './app.js', './billing.js', './manifest.json'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request).then(response => response || caches.match('./index.html'))));
});
