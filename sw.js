// Offline cache for the Wörterbuch.
// - data.bin?v=… (the dictionary, ~6 MB): kept after the first visit, so later visits do not download it again.
//   A new version has a new ?v=, so updates arrive automatically and the old copy is removed.
// - the page itself: always asked from the network first (so changes show at once), the saved copy is used
//   only when the network is slow (over 4 s) or offline.
const DATA = 'wb-data', PAGE = 'wb-page';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== self.location.origin) return;

  if (u.pathname.endsWith('/data.bin')) {
    e.respondWith(caches.open(DATA).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok) {
        await c.put(req, r.clone());
        (await c.keys()).forEach(k => { if (k.url !== req.url) c.delete(k); });
      }
      return r;
    }).catch(() => fetch(req)));
    return;
  }

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(PAGE);
      const net = fetch(req).then(r => { if (r.ok) c.put('page', r.clone()); return r; });
      const slow = new Promise(res => setTimeout(res, 4000)).then(() => c.match('page'));
      try {
        const r = await Promise.race([net, slow]);
        return r || await net;
      } catch (err) {
        return (await c.match('page')) || Response.error();
      }
    })());
  }
});
