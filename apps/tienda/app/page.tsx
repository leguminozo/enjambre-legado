import { getSiteContentBatch, type SiteSectionItem } from '@/lib/cms';
import { getEcosystemMetrics, type EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import { listVisibleProducts, type ShopProduct } from '@/lib/shop/products';
import { TiendaLandingView } from './landing-view';

type ColeccionItem = { kicker: string; title: string; desc: string; href: string };
type FooterBranding = { tagline: string; email: string };
type FooterLink = { label: string; href: string };
type MediaItem = { type: 'image' | 'video'; src: string; alt?: string };

function extractContent<T extends Record<string, unknown>>(items: SiteSectionItem[]): T[] {
  return items.map((item) => item.content as T);
}

export const revalidate = 300;

export default async function TiendaPage() {
  const [cmsBatch, ecosystemMetrics, products] = await Promise.all([
    getSiteContentBatch(['colecciones', 'footer_branding', 'footer_nav', 'footer_legal']),
    getEcosystemMetrics(),
    listVisibleProducts(),
  ]);

  const coleccionesData = cmsBatch.colecciones ?? [];
  const footerBrandingData = cmsBatch.footer_branding ?? [];
  const footerNavData = cmsBatch.footer_nav ?? [];
  const footerLegalData = cmsBatch.footer_legal ?? [];

  const colecciones = coleccionesData.length > 0
    ? extractContent<ColeccionItem>(coleccionesData)
    : [
        { kicker: 'Sachets', title: 'Gotas de Néctar', desc: '¡Lleva contigo la dulzura del bosque! Perfecto tamaño para tus experiencias diarias.', href: '/catalogo' },
        { kicker: 'Frascos Medios', title: 'Tesoros del Colmenar', desc: '¡La dulzura boscosa en tu mesa! En tus preparaciones y en cada cucharada.', href: '/catalogo' },
        { kicker: 'Frascos Mayores', title: 'Reservas del Bosque', desc: '¡Nuestra mayor reserva para el futuro! Sobrevive a la incertidumbre y acompaña esos momentos que merecen lo mejor.', href: '/catalogo' },
        { kicker: 'Miel Virgen', title: 'Panal de Bosque', desc: 'El placer de miel, libre de intervenciones. La pureza del néctar. Huella directa del cosmos.', href: '/catalogo' },
        { kicker: 'Cajas de Sachets', title: 'Cofres del Enjambre', desc: '20 Sachets para disfrutar, compartir, recordar. El bosque a tu ritmo de vida.', href: '/catalogo' },
        { kicker: 'Suscripciones', title: 'Legado del Bosque', desc: 'La búsqueda de legado y regeneración desde el sur del planeta. Disfruta de nuestras creaciones en su máximo esplendor.', href: '/catalogo' },
      ];

  const mediaItems: MediaItem[] = [
    { type: 'image', src: '/assets/editorial/immersion.png', alt: 'Inmersión en el bosque' },
    { type: 'image', src: '/assets/editorial/sachets.png', alt: 'Sachets de miel' },
    { type: 'image', src: '/assets/editorial/honey-jar.png', alt: 'Frascos de miel' },
  ];

  const youtubeVideoId = process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID || 'dQw4w9WgXcQ';

  const footerData = {
    branding: (footerBrandingData[0]?.content ?? { tagline: '¡Seamos Legado! Luce saludable. Sé parte del cambio.', email: 'hola@obrerayzangano.com' }) as FooterBranding,
    nav: footerNavData.length > 0 ? extractContent<FooterLink>(footerNavData) : [],
    legal: footerLegalData.length > 0 ? extractContent<FooterLink>(footerLegalData) : [],
  };

  return (
    <TiendaLandingView
      initialColecciones={colecciones}
      products={products}
      mediaItems={mediaItems}
      youtubeVideoId={youtubeVideoId}
      footerData={footerData}
      ecosystemMetrics={ecosystemMetrics}
    />
  );
}
