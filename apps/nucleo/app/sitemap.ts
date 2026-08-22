import type { MetadataRoute } from 'next';
import { COMUNAS_CHILOE } from '@/lib/chiloe-comunas';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.registroapicolachiloe.me';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/mapa-chiloe`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${siteUrl}/municipalidades`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${siteUrl}/municipalidades/kit`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/municipalidades/ordenanza-modelo`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${siteUrl}/comuna`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${siteUrl}/planes-territoriales`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/carta`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/impacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/terminos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  const comunaRoutes: MetadataRoute.Sitemap = COMUNAS_CHILOE.map((comuna) => ({
    url: `${siteUrl}/comuna/${comuna.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...comunaRoutes];
}
