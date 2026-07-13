/* 乗務実績ビューア Service Worker */
/* ↓このバージョン番号は 更新.bat 実行時に自動で書き換わる（手で触らない） */
const V = 'taxi-viewer-20260714024938';
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

/* index.html と data.js は常にネット優先（HTTPキャッシュも迂回して最新を取得）、
   アイコン等はキャッシュ優先。オフライン時はキャッシュで表示 */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isData = url.pathname.endsWith('data.js');
  const isPage = e.request.mode === 'navigate' ||
                 url.pathname.endsWith('index.html') || url.pathname.endsWith('/');
  if (isData || isPage) {
    e.respondWith(
      fetch(url.href, { cache: 'no-store' }).then(r => {
        if (r.ok) { const clone = r.clone(); caches.open(V).then(c => c.put(e.request, clone)); }
        return r;
      }).catch(() =>
        caches.match(e.request).then(hit => hit || caches.match('index.html'))
      )
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
