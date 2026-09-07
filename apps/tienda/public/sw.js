/**
 * PWA mínima: NO interceptar /_next/* (chunks/CSS cambian en cada deploy).
 * HTML: red primero para no servir documentos viejos con hashes rotos.
 * Auth/commerce: NetworkOnly (no cachear shell de sesión / checkout).
 */
const CACHE_NAME = 'oyz-tienda-v2.7';

const PRECACHE_URLS = [
  '/manifest.webmanifest',
  '/assets/editorial/immersion.png',
  '/assets/editorial/honey-jar.png',
  '/assets/editorial/sachets.png',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

/** Rutas con estado de sesión o dinero — nunca cachear el documento HTML. */
function isAuthOrCommercePath(pathname) {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/carrito') ||
    pathname.startsWith('/recuperar') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/claim')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Purge stale caches from previous SW versions.
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
            return Promise.resolve();
          }),
        ),
      ),
      // Enable Navigation Preload so the browser doesn't warn about
      // "cross-world service worker resource mismatch" for <link modulepreload>
      // injected by Next.js/Turbopack.
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

  // Bundles de Next: no interceptar — si el SW llama event.respondWith()
  // en requests de modulepreload, Chrome emite "cross-world service worker
  // resource mismatch". Un return simple deja que el browser use su caché
  // de preload nativo directamente.
  if (url.pathname.startsWith('/_next/')) {
    return;
  }

  // RSC y App Router data: siempre red (incluye ?_rsc= en Next 15+).
  const isRscFlight =
    url.searchParams.has('_rsc') ||
    request.headers.has('RSC') ||
    request.headers.has('Next-Router-Prefetch') ||
    request.headers.has('Next-Router-State-Tree') ||
    (request.headers.get('accept') || '').includes('text/x-component');

  if (isRscFlight) {
    event.respondWith(fetch(request));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  const accept = request.headers.get('accept') || '';
  const isDocument = request.mode === 'navigate' || accept.includes('text/html');

  if (isDocument) {
    // Auth/commerce: solo red (evita HTML de sesión ajena o checkout stale en PWA).
    if (isAuthOrCommercePath(url.pathname)) {
      event.respondWith(
        fetch(request).catch(
          () =>
            new Response('Sin conexión. Vuelve a intentar.', {
              status: 503,
              statusText: 'Offline',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            }),
        ),
      );
      return;
    }

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
