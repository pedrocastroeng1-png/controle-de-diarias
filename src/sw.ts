/// <reference lib="webworker" />
import { clientsClaim, setCacheNameDetails } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;
declare const __BUILD_VERSION__: string;

const BUILD_ID = typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : Date.now().toString();

// 1. Every deployment MUST generate a completely new cache version.
const CACHE_NAME = `controle-diarias-v${BUILD_ID}`;
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

// 7. Intercept 404s to unregister SW and clear caches
const assetErrorPlugin = {
  fetchDidSucceed: async ({ response, request }) => {
    if (response.status === 404) {
      console.error('[Service Worker] Asset 404 detected, unregistering...', request.url);
      
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      await self.registration.unregister();
      
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.postMessage({ type: 'ASSET_404_RELOAD' });
      }
    }
    return response;
  }
};

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
    cacheName: HTML_CACHE,
    plugins: [assetErrorPlugin]
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
    cacheName: ASSETS_CACHE,
    plugins: [assetErrorPlugin]
  })
);

// Web Push Notification Support
self.addEventListener('push', (event) => {
  let data = { title: 'Nova Comunicação', message: 'Você tem uma nova mensagem.' };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        message: payload.body || payload.message || data.message
      };
    } catch (e) {
      data.message = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: '/logo.png',
      badge: '/logo.png'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.indexOf('/') !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
