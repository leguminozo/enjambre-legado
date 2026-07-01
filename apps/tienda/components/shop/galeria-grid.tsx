'use client';

import { useState } from 'react';
import Image from 'next/image';
import { TiendaModal } from '@/components/shop/tienda-modal';

export type GaleriaImage = {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
};

export function GaleriaGrid({ images }: { images: GaleriaImage[] }) {
  const [active, setActive] = useState<GaleriaImage | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img, idx) => (
          <button
            key={img.id || idx}
            type="button"
            onClick={() => img.url && setActive(img)}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-card border border-border text-left"
            aria-label={img.titulo ? `Ver ${img.titulo}` : 'Ver imagen de galería'}
          >
            {img.url ? (
              <Image
                src={img.url}
                alt={img.titulo || 'Galería'}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary/50 text-muted-foreground text-sm">
                {img.titulo || `Imagen ${idx + 1}`}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <h3 className="font-display text-lg sm:text-xl text-foreground mb-1">
                  {img.titulo || 'Imagen'}
                </h3>
                {img.descripcion ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">{img.descripcion}</p>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>

      <TiendaModal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.titulo}
        subtitle={active?.descripcion}
        kicker="Galería"
        ariaLabel={active?.titulo ? `Imagen: ${active.titulo}` : 'Imagen de galería'}
        size="lg"
      >
        {active?.url ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-secondary/30">
            <Image
              src={active.url}
              alt={active.titulo || 'Galería'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 42rem"
            />
          </div>
        ) : null}
      </TiendaModal>
    </>
  );
}