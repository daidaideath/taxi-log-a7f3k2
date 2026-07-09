/* 乗務実績ビューア Service Worker */
const V = 'taxi-viewer-v1';
const ASSETS = ['./', 'index.html', 'data.js', 'manifest.json',
                'icon-192.png', 'icon-512.png', 'icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
  );
});

/* data.jsは常にネット優先（更新を素早く反映）、他はキャッシュ優先 */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('/data.js') || url.pathname.endsWith('data.js')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(V).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        if (r.ok) { const clone = r.clone(); caches.open(V).then(c => c.put(e.request, clone)); }
        return r;
      }))
    );
  }
});
