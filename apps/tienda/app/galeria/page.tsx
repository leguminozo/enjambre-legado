import { getLocale } from 'next-intl/server';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContentBatch } from '@/lib/cms';
import { parseGaleriaSettings, resolveLocalized, alignToClass } from '@/lib/shop/store-chrome';
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
  titulo_en: z.string().optional(),
  descripcion: z.string().default(''),
  descripcion_en: z.string().optional(),
  url: z.string().default(''),
  orden: z.number().default(0),
});

export default async function GaleriaPage({
  searchParams,
}: {
  searchParams: Promise<{ cms_preview?: string }>;
}) {
  const draft = (await searchParams).cms_preview === '1';
  const [cmsBatch, locale] = await Promise.all([
    getSiteContentBatch(['galeria', 'galeria_settings'], { draft }),
    getLocale(),
  ]);
  const galeriaData = cmsBatch.galeria ?? [];
  const galeriaSettings = parseGaleriaSettings((cmsBatch.galeria_settings?.[0]?.content as Record<string, unknown>) ?? null);

  const kicker = resolveLocalized(galeriaSettings.kicker, galeriaSettings.kicker_en, locale);
  const title = resolveLocalized(galeriaSettings.title, galeriaSettings.title_en, locale);
  const subtitle = resolveLocalized(galeriaSettings.subtitle, galeriaSettings.subtitle_en, locale);

  const defaultImages = [
    { id: '1', content: { 
      titulo: locale === 'en' ? 'Pureo Apiary' : 'Apiario Pureo', 
      descripcion: locale === 'en' ? 'Our hives nestled in the native rainforest' : 'Nuestras colmenas en el bosque nativo',
      url: '/apiario-pureo.jpg',
      orden: 1
    }},
    { id: '2', content: { 
      titulo: locale === 'en' ? 'Honey Recolección' : 'Recolección de Miel', 
      descripcion: locale === 'en' ? 'Artisanal cold extraction of native honey' : 'Extracción artesanal de miel ulmo-tepú',
      url: '/cosecha-miel.jpg',
      orden: 2
    }},
    { id: '3', content: { 
      titulo: locale === 'en' ? 'Regenerated Forest' : 'Bosque Regenerado', 
      descripcion: locale === 'en' ? '22 years of continuous ecological sanctuary' : '22 años de regeneración ecológica',
      url: '/bosque-regenerado.jpg',
      orden: 3
    }},
    { id: '4', content: { 
      titulo: locale === 'en' ? 'Creamy Raw Honey' : 'Miel Cremosa', 
      descripcion: locale === 'en' ? 'Extra light amber texture with fine crystallization' : 'Textura ámbar extra clara',
      url: '/miel-cremosa.jpg',
      orden: 4
    }},
    { id: '5', content: { 
      titulo: locale === 'en' ? 'Native Pollinators' : 'Abeja Nativa', 
      descripcion: locale === 'en' ? 'Pollinating blossoms of the Patagonian rainforest' : 'Polinizando flores del bosque patagónico',
      url: '/abeja-nativa.jpg',
      orden: 5
    }},
    { id: '6', content: { 
      titulo: locale === 'en' ? 'Origin Bottling' : 'Envasado', 
      descripcion: locale === 'en' ? 'Small-batch artisanal bottling at origin' : 'Proceso artesanal de envasado',
      url: '/envasado.jpg',
      orden: 6
    }},
  ];

  const images = galeriaData.length > 0
    ? galeriaData.map(item => {
        const raw = item.content as Record<string, unknown>;
        // Compat: items creados con el template viejo del editor (src/alt)
        const compatible = {
          ...item.content,
          url: typeof raw.url === 'string' && raw.url ? raw.url : raw.src,
          titulo: typeof raw.titulo === 'string' && raw.titulo ? raw.titulo : raw.alt,
        };
        const parsed = GaleriaItemContentSchema.safeParse(compatible);
        const data = parsed.success ? parsed.data : { titulo: '', titulo_en: '', descripcion: '', descripcion_en: '', url: '', orden: 0 };
        return {
          id: item.id,
          content: {
            titulo: resolveLocalized(data.titulo, data.titulo_en, locale),
            descripcion: resolveLocalized(data.descripcion, data.descripcion_en, locale),
            url: data.url,
            orden: data.orden,
          },
        };
      })
    : defaultImages;

  return (
    <StoreShell>
      <ShopHeader />
      <main
        data-cms-section="galeria"
        className="mx-auto max-w-7xl px-4 sm:px-8 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-16 md:py-16"
      >
        <div data-cms-section="galeria_settings" className="text-center mb-12 md:mb-16">
          {kicker ? (
            <span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent-text mb-6">
              {kicker}
            </span>
          ) : null}
          {title ? (
            <h1 className="font-display text-[clamp(2rem,6.5vw,4.5rem)] md:text-6xl lg:text-7xl font-light text-foreground mb-6 text-balance max-w-4xl lg:max-w-5xl mx-auto leading-[1.08]">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className={`text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl lg:max-w-4xl mx-auto text-pretty leading-relaxed whitespace-pre-line ${alignToClass(galeriaSettings.text_align)}`}>
              {subtitle}
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
