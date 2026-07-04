// Jajan Terus service worker
const CACHE_NAME = 'jajanterus-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Network-first for Supabase / API
  if (url.href.includes('supabase') || url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((r) => r || Response.error())),
    );
    return;
  }

  // Cache-first for cards & assets
  if (url.pathname.startsWith('/cards/') || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      }),
    );
  }
});
