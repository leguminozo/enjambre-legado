import type { Metadata } from 'next';
import { loadStoreChrome } from '@/lib/shop/load-store-chrome';
import { isCmsPreviewRequest } from '@/lib/cms';
import { resolvePageSeoMetadata } from '@/lib/shop/store-chrome';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export interface PageMetadataFallback {
  title: string;
  description: string;
  ogType?: 'website' | 'article';
}

/**
 * Generador canónico de Metadata para páginas de la tienda.
 * Lee la configuración de SEO Studio desde `site_content` (`seo_defaults`)
 * y aplica automáticamente overrides de título, descripción, directiva noindex
 * y etiquetas de búsqueda configuradas desde Núcleo.
 */
export async function createPageMetadata(
  path: string,
  fallback: PageMetadataFallback,
): Promise<Metadata> {
  const isDraft = await isCmsPreviewRequest();
  const chrome = await loadStoreChrome({ draft: isDraft });
  const seo = resolvePageSeoMetadata(path, chrome.seo, fallback);
  const canonicalUrl = `${SITE_URL}${path === '/' ? '' : path}`;
  const ogImage = chrome.seo.og_image_url || chrome.brand.og_image_url || undefined;

  return {
    title: seo.title,
    description: seo.description,
    robots: seo.robots,
    keywords: seo.keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonicalUrl,
      type: fallback.ogType ?? 'website',
      locale: 'es_CL',
      siteName: chrome.seo.site_name || 'La Obrera y el Zángano',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
