/**
 * PWA mínima: NO interceptar /_next/* (chunks/CSS cambian en cada deploy).
 * HTML: red primero para no servir documentos viejos con hashes rotos.
 * Auth/commerce: NetworkOnly (no cachear shell de sesión / checkout).
 */
const CACHE_NAME = 'oyz-tienda-v2.8';

const PRECACHE_URLS = [
  '/manifest.webmanifest',
  '/assets/editorial/immersion.png',
  '/assets/editorial/honey-jar.png',
  '/assets/editorial/sachets.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/apple-touch-icon.png',
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

  // RSC y App Router data: red primero con fallback en caché para rutas públicas
  const isRscFlight =
    url.searchParams.has('_rsc') ||
    request.headers.has('RSC') ||
    request.headers.has('Next-Router-Prefetch') ||
    request.headers.has('Next-Router-State-Tree') ||
    (request.headers.get('accept') || '').includes('text/x-component');

  if (isRscFlight) {
    if (isAuthOrCommercePath(url.pathname)) {
      event.respondWith(fetch(request));
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
            new Response(
              '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión · La Obrera</title><style>body{background:#070707;color:#e6e6e6;font-family:ui-sans-serif,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1.5rem;text-align:center;}h1{font-size:1.5rem;font-weight:600;margin-bottom:0.5rem;color:#fff;}p{color:#a3a3a3;font-size:0.9rem;max-width:26rem;line-height:1.5;margin:0 auto;}a{color:#10b981;text-decoration:none;display:inline-block;margin-top:1.5rem;padding:0.75rem 1.5rem;border:1px solid #10b981;border-radius:9999px;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;}</style></head><body><div><h1>Acceso temporalmente pausado</h1><p>Esta sección requiere conexión activa con el servidor para resguardar la seguridad de tus datos.</p><a href="/">Volver al inicio</a></div></body></html>',
              {
                status: 503,
                statusText: 'Offline',
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
              },
            ),
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
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return new Response(
            '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión · La Obrera y el Zángano</title><style>body{background:#070707;color:#e6e6e6;font-family:ui-serif,Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1.5rem;text-align:center;}h1{font-size:1.75rem;font-weight:400;margin-bottom:0.75rem;color:#f5f5f4;letter-spacing:0.04em;}p{color:#a8a29e;font-family:ui-sans-serif,system-ui,sans-serif;font-size:0.875rem;max-width:28rem;line-height:1.6;margin:0 auto;}button{background:#115e4d;color:#fff;border:none;margin-top:2rem;padding:0.75rem 2rem;border-radius:9999px;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.15em;cursor:pointer;font-family:ui-sans-serif,system-ui,sans-serif;font-weight:600;}</style></head><body><div><h1>El bosque aguarda tu regreso</h1><p>Te encuentras sin conexión a internet en este momento. Revisa tu señal o vuelve a intentar cuando te reconectes.</p><button onclick="window.location.reload()">Reintentar conexión</button></div></body></html>',
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            },
          );
        }),
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
