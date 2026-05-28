// PWA-оживитель (dev-режим).
// Стратегия: network-first для всего, кэш — только как offline-fallback.
// API розеток (/sa/*) — всегда сеть, без кэша.
const CACHE = 'sa-shell-v3';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add('/')));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (url.pathname.startsWith('/sa/')) return;
  if (req.method !== 'GET') return;

  e.respondWith(
    fetch(req)
      .then((r) => {
        if (r.ok) {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return r;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
  );
});
