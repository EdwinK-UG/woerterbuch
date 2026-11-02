importScripts('release.js');
// Offline cache for the Wörterbuch.
// - core.bin / defs.bin ?v=… (the dictionary): kept after the first visit, so later visits do not download it
//   again. A new version has a new ?v=, so updates arrive automatically and the old copy is removed.
// - pictures from the picture service: kept on the device, so a picture seen once opens at once next time.
//   "latest" pictures are refreshed in the background at most once a day; numbered ones never change.
// - the page itself: always asked from the network first (so changes show at once), the saved copy is used
//   only when the network is slow (over 4 s) or offline.
const DATA = 'wb-data', PICS = 'wb-pics-1', PIC_HOST = 'woerterbuch-bilder.edwin1kitaka.workers.dev', MAXPICS = 1500;

const SCOPE = self.registration.scope;
const SHELL = 'wb-shell-' + new URL(SCOPE).pathname + '-' + SHELL_RELEASE;
const LESSONS = 'wb-lessons-' + new URL(SCOPE).pathname;
self.addEventListener('install', event => event.waitUntil((async()=>{
  const cache=await caches.open(SHELL);
  await cache.addAll(SHELL_ASSETS.map(file=>new URL(file,SCOPE).href));
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async()=>{
  const prefix='wb-shell-'+new URL(SCOPE).pathname+'-';
  const releases=(await caches.keys()).filter(name=>name.startsWith(prefix));
  for(const name of releases.slice(0,-2))if(name!==SHELL)await caches.delete(name);
  await self.clients.claim();
})()));

const fileOf = url => new URL(url).pathname.split('/').pop();

async function trimPics(c) {
  const keys = await c.keys();
  for (let i = 0; i < keys.length - MAXPICS; i++) await c.delete(keys[i]);   // oldest first
}

async function picture(e, u) {
  const c = await caches.open(PICS), key = u.href;
  const hit = await c.match(key);
  const refresh = () => fetch(key, { mode: 'cors', credentials: 'omit' }).then(async r => {
    if (r.ok && /^image\//.test(r.headers.get('content-type') || '')) {
      const copy = new Response(await r.clone().blob(), { headers: { 'Content-Type': r.headers.get('content-type'), 'X-Saved': String(Date.now()) } });
      await c.put(key, copy); trimPics(c);
    }
    return r;
  });
  if (hit) {
    const age = Date.now() - (+hit.headers.get('X-Saved') || 0);
    if (u.searchParams.get('seed') === 'latest' && age > 864e5) e.waitUntil(refresh().catch(() => {}));
    return hit;
  }
  try { return await refresh(); } catch (err) { return fetch(e.request); }
}

self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET') return;

  if (u.host === PIC_HOST && u.pathname === '/pic') { e.respondWith(picture(e, u)); return; }
  if (u.origin !== self.location.origin || !u.pathname.startsWith(new URL(SCOPE).pathname)) return;

  if (/\/(core|defs|data)\.bin$/.test(u.pathname)) {
    e.respondWith(caches.open(DATA).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok) {
        await c.put(req, r.clone());
        const name = fileOf(req.url);       // remove older versions of this file and the old single data.bin
        (await c.keys()).forEach(k => { const f = fileOf(k.url); if ((f === name || f === 'data.bin') && k.url !== req.url) c.delete(k); });
      }
      return r;
    }).catch(() => fetch(req)));
    return;
  }

  if (/\/(?:konto\.js|js\/[^/]+\.js|grammatik\/[^/]+\.js|icon-[^/]+\.png|favicon\.ico)$/.test(u.pathname)) {
    e.respondWith((async()=>{
      const lessons=u.pathname.includes('/grammatik/k');
      const cache=await caches.open(lessons?LESSONS:SHELL),hit=await cache.match(req);
      if(hit)return hit;
      const response=await fetch(req);
      if(response.ok){await cache.put(req,response.clone());if(lessons){const keys=await cache.keys();for(const key of keys.slice(0,-200))await cache.delete(key)}}
      return response;
    })());return;
  }

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(SHELL);
      const net = fetch(req).then(r => { if (r.ok) e.waitUntil(c.put(SCOPE, r.clone())); return r; });
      const slow = new Promise(res => setTimeout(res, 4000)).then(() => c.match(SCOPE));
      try {
        const r = await Promise.race([net, slow]);
        return r || await net;
      } catch (err) {
        return (await c.match(SCOPE)) || Response.error();
      }
    })());
  }
});
