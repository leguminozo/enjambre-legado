import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/api/knowledge/',
          '/api/openapi.json',
          '/llms.txt',
          '/llms-full.txt',
          '/agents.txt',
          '/demo/perfil/',
        ],
        disallow: [
          '/api/',
          '/checkout/',
          '/perfil/',
          '/claim/',
          '/login',
          '/register',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/api/knowledge/',
          '/api/openapi.json',
          '/llms.txt',
          '/llms-full.txt',
          '/agents.txt',
          '/demo/perfil/',
        ],
        disallow: [
          '/api/agents/',
          '/checkout/',
          '/perfil/',
          '/claim/',
          '/login',
          '/register',
        ],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      {
        userAgent: 'Bytespider',
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
