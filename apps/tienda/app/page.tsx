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
  DEFAULT_CONSERVATION_CONTENT,
  DEFAULT_IDENTIDAD_SETTINGS,
  DEFAULT_CLUB_LEGADO_SETTINGS,
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

export const revalidate = 300;

// Metadata propia del landing: la home no debe depender solo de los defaults
// del layout (que sirven a todo el sitio). El template del layout agrega la marca.
export const metadata: Metadata = {
  title: 'Pureo, Chiloé · Miel de Patrimonio Forestal y Custodia de Origen',
  description:
    'Miel cruda de floración viva, batido en frío y panal silvestre del Predio Pureo. 22 años regenerando el bosque nativo en Chiloé — La Obrera y el Zángano.',
  openGraph: {
    title: 'Pureo, Chiloé · Miel de Patrimonio Forestal y Custodia de Origen',
    description:
      'Miel cruda de floración viva, batido en frío y panal silvestre del Predio Pureo. 22 años regenerando el bosque nativo en Chiloé.',
    type: 'website',
  },
};

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<{ cms_preview?: string }>;
}) {
  // Preview del editor: ?cms_preview=1 muestra los borradores del CMS
  const draft = (await searchParams).cms_preview === '1';
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
      ],
      { draft },
    ),
    getEcosystemMetrics(),
    fetchRatingAggregatesByProduct(products.map((p) => p.id)),
  ]);

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
      locale="es"
      initialColecciones={colecciones}
      collectionsSettings={collectionsSettings}
      identidadSettings={identidadSettings}
      clubLegadoSettings={clubLegadoSettings}
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
    />
  );
}
