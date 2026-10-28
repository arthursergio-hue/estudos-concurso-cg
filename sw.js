/* Cache simples para abrir sem internet: sempre tenta a rede primeiro e guarda a última cópia. */
const CACHE = 'cg-estudos-v2';
const BASE = ['./', 'index.html', 'app/style.css', 'app/app.js', 'app/md.js', 'manifest.webmanifest', 'app/icons/icon.svg',
  'app/icons/icon-192.png', 'data/index.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // Provas digitadas e figuras quase não mudam: abre do cache na hora e atualiza por trás.
  if (/\/data\/provas\//.test(u.pathname)) {
    e.respondWith(caches.open(CACHE).then(async ca => {
      const salvo = await ca.match(e.request, { ignoreSearch: true });
      const rede = fetch(e.request).then(r => { if (r.ok) ca.put(e.request, r.clone()); return r; }).catch(() => salvo);
      return salvo || rede;
    }));
    return;
  }
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
