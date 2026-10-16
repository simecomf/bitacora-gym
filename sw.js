/* Service worker: guarda la app y la librería XLSX para usarla sin internet.
   Sube VERSION cuando cambies algún archivo para que los teléfonos se actualicen. */
const VERSION = 'v1';
const APP = 'bitacora-app-' + VERSION;
const RUNTIME = 'bitacora-runtime';
const XLSX = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const FILES = ['./', 'index.html', 'localdb.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(APP);
    await c.addAll(FILES);
    await c.add(new Request(XLSX, { mode: 'cors' }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== APP && k !== RUNTIME) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // app files: answer from cache at once, refresh it in the background
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const c = await caches.open(APP);
      const key = req.mode === 'navigate' ? 'index.html' : req;
      const hit = await c.match(key, { ignoreSearch: true });
      const net = fetch(req).then(r => { if (r.ok) c.put(key, r.clone()); return r; });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    })());
    return;
  }
  // XLSX library and Google Fonts: cache first
  if (req.url === XLSX || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok || r.type === 'opaque') (await caches.open(RUNTIME)).put(req, r.clone());
      return r;
    })());
  }
});
