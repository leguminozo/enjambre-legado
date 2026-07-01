import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Enjambre Legado Tienda',
    short_name: 'Enjambre',
    description: 'Tienda PWA de Enjambre Legado',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#070707',
    theme_color: '#115e4d',
    categories: ['shopping', 'food'],
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      { name: 'Tu carrito', short_name: 'Carrito', url: '/carrito', icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }] },
      { name: 'Creaciones', short_name: 'Tienda', url: '/catalogo', icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }] },
      { name: 'Escanear QR', short_name: 'QR', url: '/qr-scan', icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }] },
      { name: 'Mi Legado', short_name: 'Perfil', url: '/perfil', icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }] },
    ],
  };
}

