/// <reference lib="webworker" />
import { clientsClaim, setCacheNameDetails } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;
declare const __BUILD_VERSION__: string;

const BUILD_ID = typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : Date.now().toString();

// 1. Every deployment MUST generate a completely new cache version.
const CACHE_NAME = `pceg-v${BUILD_ID}`;
const HTML_CACHE = `html-cache-${BUILD_ID}`;
const ASSETS_CACHE = `assets-cache-${BUILD_ID}`;

setCacheNameDetails({
  prefix: 'diarias',
  suffix: BUILD_ID,
  precache: 'precache',
  runtime: 'runtime',
});

// 4. Update dialog triggers SKIP_WAITING
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});



// 2. Delete ALL previous caches during activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes(BUILD_ID)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


// precache manifest from VitePWA
const manifest = self.__WB_MANIFEST || [];
const filteredManifest = manifest.filter(entry => {
  const url = typeof entry === 'string' ? entry : entry.url;
  // Do not precache index.html (Requirement 5)
  return !url.endsWith('index.html');
});

precacheAndRoute(filteredManifest);

// 5. Never cache index.html. Use NetworkFirst.
registerRoute(
  ({ request, url }) => request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html',
  new NetworkFirst({
    cacheName: HTML_CACHE
  })
);

// 6. JS bundles, CSS, Images, Fonts, Manifest, Icons must use StaleWhileRevalidate.
registerRoute(
  ({ request }) => 
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'manifest',
  new StaleWhileRevalidate({
    cacheName: ASSETS_CACHE
  })
);

// Web Push Notification Support
self.addEventListener('push', (event: any) => {
  let title = 'Nova Notificação';
  let body = 'Você tem uma nova mensagem.';
  let dataPayload: any = {};
  
  if (event.data) {
    try {
      const payload = event.data.json();
      
      // Handle standard FCM structure
      if (payload.notification) {
        title = payload.notification.title || title;
        body = payload.notification.body || body;
      } else if (payload.title || payload.body || payload.message) {
        title = payload.title || title;
        body = payload.body || payload.message || body;
      }
      
      if (payload.data) {
        dataPayload = payload.data;
      }
    } catch (e) {
      body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: '/icons/icon1.png',
      badge: '/icons/icon1.png',
      data: dataPayload
    })
  );
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((windowClients: any) => {
      let targetUrl = '/';
      
      if (event.notification.data) {
        if (event.notification.data.route) {
          targetUrl = event.notification.data.route;
        } else if (event.notification.data.link) {
          targetUrl = event.notification.data.link;
        } else if (event.notification.data.communication_id) {
          targetUrl = '/admin/comunicacoes';
        } else if (event.notification.data.presenca_id) {
          targetUrl = '/admin/auditoria';
        }
      }

      // Check if there is already a window/tab open
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      
      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
