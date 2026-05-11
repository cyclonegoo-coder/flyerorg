const CACHE_NAME = 'flyerorg-v147';
const OFFLINE_URL = 'offline.html';

// Bei Installation: Offline-Seite cachen
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

// Bei Aktivierung: alte Caches löschen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first Strategie: Immer frisch laden, nur bei Offline auf Cache zurückfallen
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});

// ── Push-Benachrichtigungen ──
self.addEventListener('push', e => {
  let data = { title: 'FlyerOrg', body: 'Neue Benachrichtigung', icon: '/icon-192.png', badge: '/icon-192.png' };
  try {
    if (e.data) {
      const payload = e.data.json();
      data = { ...data, ...payload };
    }
  } catch (err) {
    if (e.data) data.body = e.data.text();
  }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
      tag: data.tag || 'flyerorg-default',
      renotify: true
    })
  );
});

// Beim Klick auf die Benachrichtigung: App öffnen/fokussieren
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Vorhandenes Fenster fokussieren
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Oder neues Fenster öffnen
      return clients.openWindow(url);
    })
  );
});
