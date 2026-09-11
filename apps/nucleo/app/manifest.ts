import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Enjambre Legado · Núcleo',
    short_name: 'Núcleo',
    description: 'Plataforma central de apicultura regenerativa — Centro de mando unificado',
    start_url: '/',
    display: 'standalone',
    background_color: '#041510',
    theme_color: '#0A3D2F',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
