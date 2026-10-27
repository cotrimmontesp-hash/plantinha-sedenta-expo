// Service worker da versão web (Expo). Rede primeiro; sem rede, usa a cópia guardada.
// Assim o jogo abre offline depois da 1ª visita e nunca fica preso numa versão velha.
// Também mostra os avisos do despertador no Chrome do Android (registration.showNotification).
const CACHE = 'plantinha-expo-v1';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/logo192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('/') : undefined)).then((r) => r || Response.error()))
  );
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ls) => {
    for (const c of ls) if ('focus' in c) return c.focus();
    if (self.clients.openWindow) return self.clients.openWindow('/');
  }));
});
