/* Service Worker игры «Ферма Пикселей»: precache + cache-first + уведомление об обновлении.
   ВАЖНО: имя кэша = версия игры. Выпустили новую версию → поменяйте CACHE ниже
   И версию в manifest.json (поле "version") — должны совпадать. */
const CACHE = 'farm-clicker-v16';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        // Новая версия установилась и уже управляет страницей.
        // Говорим каждой открытой вкладке/окну игры: покажи табличку «Вышло обновление!».
        clients.forEach((c) => c.postMessage({ type: 'UPDATE_READY' }));
      })
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});