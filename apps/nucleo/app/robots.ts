import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.registroapicolachiloe.me';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/mapa-chiloe',
          '/municipalidades',
          '/municipalidades/*',
          '/comuna',
          '/comuna/*',
          '/planes-territoriales',
          '/carta',
          '/privacidad',
          '/terminos',
          '/punto-de-venta/*',
          '/lote/*',
          '/hidromiel/*',
          '/alambique/*',
        ],
        disallow: [
          '/api/',
          '/login',
          '/reset-password',
          '/inicio',
          '/colmenas',
          '/produccion',
          '/contable',
          '/conciliacion',
          '/configuracion',
          '/crm',
          '/ejecutivo',
          '/despacho',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
