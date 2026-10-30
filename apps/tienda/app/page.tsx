import type { Metadata } from 'next';
import { getSiteContentBatch } from '@/lib/cms';
import { getEcosystemMetrics, type EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import { listVisibleProducts, type ShopProduct } from '@/lib/shop/products';
import { fetchRatingAggregatesByProduct } from '@/lib/shop/catalog-ratings';
import {
  type ConservationContent,
  type IdentidadSettings,
  type HomeMediaItem,
  type MapSettings,
  type ProductsSettings,
  type VideoSettings,
  type CollectionsSettings,
  type MediaSettings,
  type ClubLegadoSettings,
  type ExperienciasHomeSettings,
  type AlianzasHomeSettings,
  DEFAULT_CONSERVATION_CONTENT,
  DEFAULT_IDENTIDAD_SETTINGS,
  DEFAULT_CLUB_LEGADO_SETTINGS,
  DEFAULT_EXPERIENCIAS_HOME_SETTINGS,
  DEFAULT_ALIANZAS_HOME_SETTINGS,
  DEFAULT_MEDIA_ITEMS,
  DEFAULT_MEDIA_SETTINGS,
  DEFAULT_MAP_SETTINGS,
  DEFAULT_PRODUCTS_SETTINGS,
  DEFAULT_VIDEO_SETTINGS,
  DEFAULT_COLLECTIONS_SETTINGS,
  DEFAULT_HOME_COLECCIONES,
  parseConservationContent,
  parseIdentidadSettings,
  parseClubLegadoSettings,
  parseExperienciasHomeSettings,
  parseAlianzasHomeSettings,
  parseHomeMediaItem,
  parseMediaSettings,
  parseMapSettings,
  parseProductsSettings,
  parseVideoSettings,
  parseCollectionsSettings,
} from '@/lib/shop/store-chrome';
import { TiendaLandingView } from './landing-view';

type ColeccionItem = { kicker: string; title: string; desc: string; href: string; image?: string };

function normalizeColeccion(raw: Record<string, unknown>): ColeccionItem {
  const image =
    typeof raw.image === 'string' && raw.image
      ? raw.image
      : typeof raw.url === 'string'
        ? raw.url
        : undefined;
  return {
    kicker: String(raw.kicker ?? ''),
    title: String(raw.title ?? raw.titulo ?? ''),
    desc: String(raw.desc ?? raw.descripcion ?? ''),
    href: String(raw.href ?? ''),
    image,
  };
}

import { createPageMetadata } from '@/lib/shop/page-metadata';
import { getLocale } from 'next-intl/server';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('/', {
    title: 'Pureo, Chiloé · Miel de Patrimonio Forestal y Origen Territorial',
    description:
      'Miel cruda de floración viva, batido en frío y panal silvestre del Predio Pureo. 22 años cuidando el bosque nativo en Chiloé — La Obrera y el Zángano.',
  });
}

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<{ cms_preview?: string }>;
}) {
  const [locale, searchParamsResolved] = await Promise.all([
    getLocale(),
    searchParams,
  ]);
  // Preview del editor: ?cms_preview=1 muestra los borradores del CMS
  const draft = searchParamsResolved.cms_preview === '1';
  // Footer legacy (footer_branding/nav/legal) retirado: el pie real es StoreChrome.
  // Hero no se carga aquí: landing usa i18n + landing_layout (CTA).
  // Contenido de bloques del home (ola 4): conservation_content, media_items,
  let products: ShopProduct[] = [];
  try {
    products = await listVisibleProducts();
  } catch (err) {
    console.warn('[HomePage] Fallback al cargar productos:', err);
  }
  const [cmsBatch, ecosystemMetrics, ratings] = await Promise.all([
    getSiteContentBatch(
      [
        'colecciones',
        'collections_settings',
        'identidad_settings',
        'club_legado_settings',
        'conservation_content',
        'media_items',
        'media_settings',
        'video_settings',
        'map_settings',
        'products_settings',
        'experiencias_home_settings',
        'alianzas_home_settings',
        'galeria',
      ],
      { draft },
    ),
    getEcosystemMetrics(),
    fetchRatingAggregatesByProduct(products.map((p) => p.id)),
  ]);

  const galeriaData = cmsBatch.galeria ?? [];
  const galeriaItems = galeriaData
    .map((row) => {
      const c = (row.content as Record<string, unknown>) ?? {};
      return {
        id: row.id,
        titulo: String(c.titulo ?? ''),
        descripcion: String(c.descripcion ?? ''),
        url: typeof c.url === 'string' ? c.url : '',
        orden: typeof c.orden === 'number' ? c.orden : 0,
      };
    })
    .filter((img) => Boolean(img.url))
    .sort((a, b) => a.orden - b.orden);

  const coleccionesData = cmsBatch.colecciones ?? [];
  const coleccionesCms = coleccionesData.map((row) =>
    normalizeColeccion(row.content as Record<string, unknown>),
  );
  const coleccionesHabitadas = coleccionesCms.filter(
    (c) => c.title.trim() || c.kicker.trim() || Boolean(c.image),
  );
  // Borradores vacíos no deben tumbar las 6 tarjetas fijas de la tienda pública.
  const colecciones = coleccionesHabitadas.length > 0 ? coleccionesCms : [...DEFAULT_HOME_COLECCIONES];

  const collectionsSettings: CollectionsSettings = cmsBatch.collections_settings?.[0]
    ? parseCollectionsSettings(cmsBatch.collections_settings[0].content as Record<string, unknown>)
    : DEFAULT_COLLECTIONS_SETTINGS;

  const identidadSettings: IdentidadSettings = cmsBatch.identidad_settings?.[0]
    ? parseIdentidadSettings(cmsBatch.identidad_settings[0].content as Record<string, unknown>)
    : DEFAULT_IDENTIDAD_SETTINGS;

  const clubLegadoSettings: ClubLegadoSettings = cmsBatch.club_legado_settings?.[0]
    ? parseClubLegadoSettings(cmsBatch.club_legado_settings[0].content as Record<string, unknown>)
    : DEFAULT_CLUB_LEGADO_SETTINGS;

  const experienciasHomeSettings: ExperienciasHomeSettings = cmsBatch.experiencias_home_settings?.[0]
    ? parseExperienciasHomeSettings(cmsBatch.experiencias_home_settings[0].content as Record<string, unknown>)
    : DEFAULT_EXPERIENCIAS_HOME_SETTINGS;

  const alianzasHomeSettings: AlianzasHomeSettings = cmsBatch.alianzas_home_settings?.[0]
    ? parseAlianzasHomeSettings(cmsBatch.alianzas_home_settings[0].content as Record<string, unknown>)
    : DEFAULT_ALIANZAS_HOME_SETTINGS;

  const conservationContent: ConservationContent = cmsBatch.conservation_content?.[0]
    ? parseConservationContent(
        cmsBatch.conservation_content[0].content as Record<string, unknown>,
      )
    : DEFAULT_CONSERVATION_CONTENT;

  const mediaItems: HomeMediaItem[] = (cmsBatch.media_items ?? [])
    .map((row) => parseHomeMediaItem(row.content as Record<string, unknown>))
    .filter((m): m is HomeMediaItem => m !== null);
  const resolvedMediaItems = mediaItems.length > 0 ? mediaItems : DEFAULT_MEDIA_ITEMS;

  const mediaSettings: MediaSettings = cmsBatch.media_settings?.[0]
    ? parseMediaSettings(cmsBatch.media_settings[0].content as Record<string, unknown>)
    : DEFAULT_MEDIA_SETTINGS;

  const videoSettings: VideoSettings = cmsBatch.video_settings?.[0]
    ? parseVideoSettings(cmsBatch.video_settings[0].content as Record<string, unknown>)
    : DEFAULT_VIDEO_SETTINGS;
  const videoId =
    videoSettings.youtube_id || process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID || 'btf0A6zzZtI';

  const mapSettings: MapSettings = cmsBatch.map_settings?.[0]
    ? parseMapSettings(cmsBatch.map_settings[0].content as Record<string, unknown>)
    : DEFAULT_MAP_SETTINGS;

  const productsSettings: ProductsSettings = cmsBatch.products_settings?.[0]
    ? parseProductsSettings(cmsBatch.products_settings[0].content as Record<string, unknown>)
    : DEFAULT_PRODUCTS_SETTINGS;

  return (
    <TiendaLandingView
      locale={locale}
      initialColecciones={colecciones}
      collectionsSettings={collectionsSettings}
      identidadSettings={identidadSettings}
      clubLegadoSettings={clubLegadoSettings}
      experienciasHomeSettings={experienciasHomeSettings}
      alianzasHomeSettings={alianzasHomeSettings}
      products={products}
      ratings={ratings}
      mediaItems={resolvedMediaItems}
      mediaSettings={mediaSettings}
      videoId={videoId}
      videoTitle={videoSettings.title || 'La Obrera y el Zángano'}
      conservationContent={conservationContent}
      mapSettings={mapSettings}
      productsSettings={productsSettings}
      ecosystemMetrics={ecosystemMetrics}
      galeriaItems={galeriaItems}
    />
  );
}
