import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContentBatch } from '@/lib/cms';
import { parseGaleriaSettings } from '@/lib/shop/store-chrome';
import { GaleriaGrid } from '@/components/shop/galeria-grid';
import type { Metadata } from 'next';
import { z } from 'zod';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Galería',
  description:
    'Recorrido visual del apiario, la recolección y el bosque regenerado en Chiloé — La Obrera y el Zángano.',
  alternates: { canonical: `${SITE_URL}/galeria` },
  openGraph: {
    title: 'Galería · La Obrera y el Zángano',
    description:
      'Recorrido visual del apiario, la recolección y el bosque regenerado en Chiloé.',
    url: `${SITE_URL}/galeria`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galería · La Obrera y el Zángano',
    description:
      'Recorrido visual del apiario, la recolección y el bosque regenerado en Chiloé.',
  },
};

const GaleriaItemContentSchema = z.object({
  titulo: z.string().default(''),
  descripcion: z.string().default(''),
  url: z.string().default(''),
  orden: z.number().default(0),
});

export default async function GaleriaPage({
  searchParams,
}: {
  searchParams: Promise<{ cms_preview?: string }>;
}) {
  const draft = (await searchParams).cms_preview === '1';
  const cmsBatch = await getSiteContentBatch(['galeria', 'galeria_settings'], { draft });
  const galeriaData = cmsBatch.galeria ?? [];
  const galeriaSettings = parseGaleriaSettings((cmsBatch.galeria_settings?.[0]?.content as Record<string, unknown>) ?? null);

  // Fallbacks: solo assets que existen en apps/tienda/public (no inventar rutas).
  const defaultImages = [
    {
      id: '1',
      content: {
        titulo: 'Bosque de Pureo',
        descripcion: 'Apertura del bosque nativo donde cuidamos las colmenas',
        url: '/assets/editorial/hero-bosque-apertura.jpg',
        orden: 1,
      },
    },
    {
      id: '2',
      content: {
        titulo: 'Tronco y luz',
        descripcion: 'El bosque regenerado de Chiloé, 22 años de paciencia',
        url: '/assets/editorial/hero-bosque-tronco.jpg',
        orden: 2,
      },
    },
    {
      id: '3',
      content: {
        titulo: 'Hueco del bosque',
        descripcion: 'Geografía salvaje del sur del planeta',
        url: '/assets/editorial/hero-hueco.jpg',
        orden: 3,
      },
    },
    {
      id: '4',
      content: {
        titulo: 'Experiencias',
        descripcion: 'Recorrido sensorial del apiario a la mesa',
        url: '/assets/editorial/experiencias.jpg',
        orden: 4,
      },
    },
    {
      id: '5',
      content: {
        titulo: 'Frascos de miel',
        descripcion: 'Crema ulmo-tepú en formatos de mesa y reserva',
        url: '/assets/editorial/honey-jar.png',
        orden: 5,
      },
    },
    {
      id: '6',
      content: {
        titulo: 'Sachets',
        descripcion: 'Gotas de Néctar para llevar el bosque contigo',
        url: '/assets/editorial/sachets.png',
        orden: 6,
      },
    },
  ];

  const BROKEN_ROOT_ASSET = /^\/(?:apiario-pureo|cosecha-miel|bosque-regenerado|miel-cremosa|abeja-nativa|envasado)\.(?:jpg|jpeg|png|webp)$/i;

  const images = (galeriaData.length > 0
    ? galeriaData.map((item, idx) => {
        const raw = item.content as Record<string, unknown>;
        // Compat: items creados con el template viejo del editor (src/alt)
        const compatible = {
          ...item.content,
          url: typeof raw.url === 'string' && raw.url ? raw.url : raw.src,
          titulo: typeof raw.titulo === 'string' && raw.titulo ? raw.titulo : raw.alt,
        };
        const parsed = GaleriaItemContentSchema.safeParse(compatible);
        const content = parsed.success
          ? parsed.data
          : { titulo: '', descripcion: '', url: '', orden: 0 };
        // CMS a veces guarda rutas legacy rotas en la raíz pública.
        if (content.url && BROKEN_ROOT_ASSET.test(content.url)) {
          const fallback = defaultImages[idx % defaultImages.length]?.content.url ?? '';
          return { id: item.id, content: { ...content, url: fallback } };
        }
        return { id: item.id, content };
      })
    : defaultImages
  ).filter((img) => Boolean(img.content?.url));

  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-8 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-16 md:py-16">
        <div className="text-center mb-12 md:mb-16">
          <span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent-text mb-6">
            {galeriaSettings.kicker || 'Galería'}
          </span>
          <h1 className="font-display text-[clamp(2rem,7vw,4.5rem)] md:text-7xl font-light text-foreground mb-6 text-balance">
            {galeriaSettings.title || 'Un recorrido visual de nuestras huellas'}
          </h1>
          {galeriaSettings.subtitle ? (
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              {galeriaSettings.subtitle}
            </p>
          ) : null}
        </div>

        <GaleriaGrid
          images={images.map((img, idx) => ({
            id: img.id || String(idx),
            titulo: img.content?.titulo || '',
            descripcion: img.content?.descripcion || '',
            url: img.content?.url || '',
          }))}
          settings={galeriaSettings}
        />
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
