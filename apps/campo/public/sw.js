/**
 * Service Worker para Campo (obrerayzangano.store)
 * - NO intercepta /_next/* (los chunks y CSS cambian en cada deploy).
 * - Documentos HTML: NetworkFirst con navigationPreload.
 * - Rutas de autenticación / APIs: bypass directo a la red (NetworkOnly).
 * - Dexie e IndexedDB manejan la persistencia offline de datos POS localmente.
 * - Notificaciones Push soportadas.
 * - Limpieza automática de cachés antiguas (incluyendo serwist-precache desactualizados).
 */

const CACHE_NAME = 'enjambre-campo-v2.0';

const PRECACHE_URLS = [
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/apple-touch-icon.png',
];

/** Rutas con estado de sesión o transaccionales — nunca cachear */
function isAuthOrMutationPath(pathname) {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Promise.allSettled evita que un 404 aislado aborte la instalación
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Purgar cachés desfasadas (incluyendo viejos caches de Serwist/Workbox)
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
            return Promise.resolve();
          }),
        ),
      ),
      self.registration.navigationPreload?.enable?.(),
    ]),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Bundles de Next.js (_next/*): NO interceptar.
  // Permite que el navegador cargue los chunks frescos del deploy sin colisiones.
  if (url.pathname.startsWith('/_next/')) {
    return;
  }

  // APIs y autenticación: siempre red directa
  if (isAuthOrMutationPath(url.pathname)) {
    return;
  }

  // RSC y App Router data: red primero con fallback en caché
  const isRscFlight =
    url.searchParams.has('_rsc') ||
    request.headers.has('RSC') ||
    request.headers.has('Next-Router-Prefetch') ||
    request.headers.has('Next-Router-State-Tree') ||
    (request.headers.get('accept') || '').includes('text/x-component');

  if (isRscFlight) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  const accept = request.headers.get('accept') || '';
  const isDocument = request.mode === 'navigate' || accept.includes('text/html');

  if (isDocument) {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          const response = preloadResponse || (await fetch(request));
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return new Response(
            '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión · Enjambre Campo</title><style>body{background:#070707;color:#e6e6e6;font-family:ui-serif,Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1.5rem;text-align:center;}h1{font-size:1.5rem;font-weight:600;margin-bottom:0.5rem;color:#fff;}p{color:#a3a3a3;font-size:0.9rem;max-width:28rem;line-height:1.5;margin:0 auto;}button{background:#115e4d;color:#fff;border:none;margin-top:1.5rem;padding:0.75rem 1.75rem;border-radius:9999px;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;cursor:pointer;}</style></head><body><div><h1>Acceso temporalmente pausado</h1><p>Te encuentras sin conexión a internet en este momento. Las ventas locales siguen operando en memoria y Dexie.</p><button onclick="window.location.reload()">Reintentar</button></div></body></html>',
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            },
          );
        }
      })(),
    );
    return;
  }

  // Activos estáticos en caché
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || 'Enjambre Legado · Campo';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-192.png',
      data: {
        url: data.data?.url || data.url || '/pos',
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Enjambre Legado · Campo', {
        body: text,
        icon: '/icons/icon-192.png',
      }),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/pos';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
