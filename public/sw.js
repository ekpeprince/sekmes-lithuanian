// LabasApp Service Worker v5
const CACHE_VERSION = 'labasapp-sw-v5';
const CACHE_STATIC = `labasapp-static-${CACHE_VERSION}`;
const CACHE_AUDIO = `labasapp-audio-${CACHE_VERSION}`;

// Core static assets guaranteed to be available without redirection
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon.svg',
];

// If running on non-www apex domain while canonical domain is www, unregister to prevent redirect interception issues on iOS WebKit
if (self.location.hostname === 'labasapp.com') {
  self.registration.unregister().catch(() => {});
}

// Install event: Pre-cache core shell pages and icons
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA: Non-fatal caching notice during install:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event: Clean up previous outdated caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_STATIC && key !== CACHE_AUDIO) {
            console.log('PWA: Clearing legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Skip non-GET requests or unsupported schemes (chrome-extension, data, blob)
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 2. Ignore all cross-origin requests (Firebase, Supabase, Google Fonts, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. Audio Cache-First Strategy for TTS voice audio (/api/tts)
  if (url.pathname === '/api/tts') {
    event.respondWith(
      caches.open(CACHE_AUDIO).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response(null, { status: 503, statusText: 'Audio Offline' });
        }
      })
    );
    return;
  }

  // 4. API routes: bypass service worker completely so API calls always hit server
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 5. Navigation requests (loading an HTML page):
  // CRITICAL for iOS Safari & Chrome on iOS:
  // If the request is for page navigation, let the native browser network stack handle it!
  // This allows domain redirects (labasapp.com -> www.labasapp.com) to succeed without WebKit Service Worker errors.
  // Only fall back to cache when the device is completely offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_STATIC);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const fallback = await cache.match('/');
        if (fallback) return fallback;
        return new Response(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline • LabasApp</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:48px 20px;background:#f7fafc;color:#1e293b"><h2 style="font-size:24px;margin-bottom:8px">LabasApp</h2><p style="color:#64748b;margin-bottom:24px">Esate neprisijungęs prie interneto (Offline).</p><button onclick="window.location.reload()" style="padding:12px 24px;border-radius:14px;background:#059669;color:white;border:none;font-size:16px;font-weight:bold;cursor:pointer">Atnaujinti</button></body></html>',
          {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          }
        );
      })
    );
    return;
  }

  // 6. Next.js static assets (_next/static, public icons): Stale-While-Revalidate
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_STATIC).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// 7. Notification Click Event: focus or open the app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 8. Push Event (for server web push)
self.addEventListener('push', (event) => {
  let data = {
    title: 'LabasApp • Lithuanian Practice',
    body: 'Time to keep your Lithuanian streak burning! 🔥',
    url: '/',
  };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
