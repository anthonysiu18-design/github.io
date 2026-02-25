// 零钱记账 Service Worker
// 缓存 App Shell，支持离线访问

const CACHE = 'zlrec-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase API 请求：走网络，不缓存
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // CDN 资源（字体、supabase-js）：网络优先，失败走缓存
  if (url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('fonts.googleapis.com')) {
    e.respondWith(
      fetch(e.request)
        .then(res => { caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // App Shell：缓存优先
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
