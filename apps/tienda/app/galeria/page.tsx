import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContent } from '@/lib/cms';
import { GaleriaGrid } from '@/components/shop/galeria-grid';
import type { Metadata } from 'next';
import { z } from 'zod';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

export const metadata: Metadata = {
  title: 'Galería',
  description:
    'Recorrido visual del apiario, la cosecha y el bosque regenerado en Chiloé — La Obrera y el Zángano.',
  alternates: { canonical: `${SITE_URL}/galeria` },
  openGraph: {
    title: 'Galería · La Obrera y el Zángano',
    description:
      'Recorrido visual del apiario, la cosecha y el bosque regenerado en Chiloé.',
    url: `${SITE_URL}/galeria`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galería · La Obrera y el Zángano',
    description:
      'Recorrido visual del apiario, la cosecha y el bosque regenerado en Chiloé.',
  },
};

const GaleriaItemContentSchema = z.object({
  titulo: z.string().default(''),
  descripcion: z.string().default(''),
  url: z.string().default(''),
  orden: z.number().default(0),
});

export default async function GaleriaPage() {
  const galeriaData = await getSiteContent('galeria');
  
  const defaultImages = [
    { id: '1', content: { 
      titulo: 'Apiario Pureo', 
      descripcion: 'Nuestras colmenas en el bosque nativo',
      url: '/apiario-pureo.jpg',
      orden: 1
    }},
    { id: '2', content: { 
      titulo: 'Cosecha de Miel', 
      descripcion: 'Extracción artesanal de miel ulmo-tepú',
      url: '/cosecha-miel.jpg',
      orden: 2
    }},
    { id: '3', content: { 
      titulo: 'Bosque Regenerado', 
      descripcion: '22 años de regeneración ecológica',
      url: '/bosque-regenerado.jpg',
      orden: 3
    }},
    { id: '4', content: { 
      titulo: 'Miel Creamosa', 
      descripcion: 'Textura ámbar extra clara',
      url: '/miel-cremosa.jpg',
      orden: 4
    }},
    { id: '5', content: { 
      titulo: 'Abeja Nativa', 
      descripcion: 'Polinizando flores del bosque patagónico',
      url: '/abeja-nativa.jpg',
      orden: 5
    }},
    { id: '6', content: { 
      titulo: 'Envasado', 
      descripcion: 'Proceso artesanal de envasado',
      url: '/envasado.jpg',
      orden: 6
    }},
  ];

  const images = galeriaData.length > 0
    ? galeriaData.map(item => {
        const parsed = GaleriaItemContentSchema.safeParse(item.content);
        return { id: item.id, content: parsed.success ? parsed.data : { titulo: '', descripcion: '', url: '', orden: 0 } };
      })
    : defaultImages;

  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <div className="text-center mb-16">
          <span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent mb-6">
            Galería
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-light text-foreground mb-6">
            Un recorrido visual de nuestras huellas
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un recorrido visual de nuestras huellas
          </p>
        </div>

        <GaleriaGrid
          images={images.map((img, idx) => ({
            id: img.id || String(idx),
            titulo: img.content?.titulo || '',
            descripcion: img.content?.descripcion || '',
            url: img.content?.url || '',
          }))}
        />
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
