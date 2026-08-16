import type { Metadata } from 'next';
import { getSiteContentBatch, type SiteSectionItem } from '@/lib/cms';
import { getEcosystemMetrics, type EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import { listVisibleProducts, type ShopProduct } from '@/lib/shop/products';
import { fetchRatingAggregatesByProduct } from '@/lib/shop/catalog-ratings';
import {
  type ConservationContent,
  type HomeMediaItem,
  type MapSettings,
  type ProductsSettings,
  type VideoSettings,
  type CollectionsSettings,
  type MediaSettings,
  DEFAULT_CONSERVATION_CONTENT,
  DEFAULT_MEDIA_ITEMS,
  DEFAULT_MEDIA_SETTINGS,
  DEFAULT_MAP_SETTINGS,
  DEFAULT_PRODUCTS_SETTINGS,
  DEFAULT_VIDEO_SETTINGS,
  DEFAULT_COLLECTIONS_SETTINGS,
  parseConservationContent,
  parseHomeMediaItem,
  parseMediaSettings,
  parseMapSettings,
  parseProductsSettings,
  parseVideoSettings,
  parseCollectionsSettings,
} from '@/lib/shop/store-chrome';
import { TiendaLandingView } from './landing-view';

type ColeccionItem = { kicker: string; title: string; desc: string; href: string; image?: string };

function extractContent<T extends Record<string, unknown>>(items: SiteSectionItem[]): T[] {
  return items.map((item) => item.content as T);
}

export const revalidate = 300;

// Metadata propia del landing: la home no debe depender solo de los defaults
// del layout (que sirven a todo el sitio). El template del layout agrega la marca.
export const metadata: Metadata = {
  title: 'Miel del bosque nativo y apicultura regenerativa del sur de Chile',
  description:
    'Miel cruda, sachets, hidromiel e infusiones del bosque valdiviano. Trazabilidad apiario a mesa, apicultura regenerativa y comercio soberano desde Chiloé — La Obrera y el Zángano.',
  openGraph: {
    title: 'Miel del bosque nativo y apicultura regenerativa del sur de Chile',
    description:
      'Miel cruda, sachets, hidromiel e infusiones del bosque valdiviano. Trazabilidad apiario a mesa y comercio soberano desde Chiloé.',
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
  // video_settings, map_settings, products_settings y collections_settings — vacío = defaults/i18n.
  const products = await listVisibleProducts();
  const [cmsBatch, ecosystemMetrics, ratings] = await Promise.all([
    getSiteContentBatch(
      [
        'colecciones',
        'collections_settings',
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

  const colecciones =
    coleccionesData.length > 0
      ? extractContent<ColeccionItem>(coleccionesData)
      : [
          {
            kicker: 'Sachets',
            title: 'Gotas de Néctar',
            desc: '¡Lleva contigo la dulzura del bosque! Perfecto tamaño para tus experiencias diarias.',
            href: '/catalogo?q=Sachet',
          },
          {
            kicker: 'Frascos Medios',
            title: 'Tesoros del Colmenar',
            desc: '¡La dulzura boscosa en tu mesa! En tus preparaciones y en cada cucharada.',
            href: '/catalogo?q=Frasco',
          },
          {
            kicker: 'Frascos Grandes',
            title: 'Generosidad de la Selva',
            desc: 'Para quienes el consumo consciente de miel es un ritual cotidiano.',
            href: '/catalogo?q=Frasco',
          },
          {
            kicker: 'Miel Virgen',
            title: 'Panal de Bosque',
            desc: 'El placer de miel, libre de intervenciones. La pureza del néctar. Huella directa del cosmos.',
            href: '/catalogo?q=Miel',
          },
          {
            kicker: 'Cajas de Sachets',
            title: 'Cofres del Enjambre',
            desc: '20 Sachets para disfrutar, compartir, recordar. El bosque a tu ritmo de vida.',
            href: '/catalogo?q=Sachet',
          },
          {
            kicker: 'Suscripciones',
            title: 'Legado del Bosque',
            desc: 'La búsqueda de legado y regeneración desde el sur del planeta. Disfruta de nuestras creaciones en su máximo esplendor.',
            href: '/catalogo?q=Suscripcion',
          },
        ];

  const collectionsSettings: CollectionsSettings = cmsBatch.collections_settings?.[0]
    ? parseCollectionsSettings(cmsBatch.collections_settings[0].content as Record<string, unknown>)
    : DEFAULT_COLLECTIONS_SETTINGS;

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
