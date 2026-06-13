import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContent } from '@/lib/cms';
import Image from 'next/image';
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {images.map((img, idx) => (
    <div key={img.id || idx} className="group relative aspect-square overflow-hidden rounded-2xl bg-card border border-border">
      {img.content?.url ? (
        <Image
          src={img.content.url}
          alt={img.content?.titulo || 'Galería'}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-secondary/50">
          <div className="text-muted-foreground text-sm">
            {img.content?.titulo || `Imagen ${idx + 1}`}
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="font-display text-xl text-foreground mb-2">
            {img.content?.titulo || 'Imagen'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {img.content?.descripcion}
          </p>
        </div>
      </div>
    </div>
  ))}
</div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
