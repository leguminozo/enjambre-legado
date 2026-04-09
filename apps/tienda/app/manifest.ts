import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Enjambre Legado Tienda',
    short_name: 'Enjambre',
    description: 'Tienda PWA de Enjambre Legado',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0A3D2F',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}

