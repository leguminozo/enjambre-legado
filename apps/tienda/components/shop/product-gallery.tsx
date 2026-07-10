'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ZoomIn } from 'lucide-react';
import { TiendaModal } from '@/components/shop/tienda-modal';

type Props = {
  photos: string[];
  alt: string;
};

export function ProductGallery({ photos, alt }: Props) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const main = photos[index] ?? photos[0];

  if (!main) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground/60">
        Sin foto
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative aspect-square w-full overflow-hidden rounded-none border-y border-border bg-card shadow-none sm:rounded-2xl sm:border sm:shadow-xl"
          aria-label="Ampliar imagen del producto"
        >
          <Image src={main} alt={alt} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            <ZoomIn size={14} />
            Ampliar
          </span>
          {photos.length > 1 ? (
            <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-2.5 py-1 text-[0.65rem] tabular-nums text-muted-foreground md:hidden">
              {index + 1}/{photos.length}
            </span>
          ) : null}
        </button>
        {photos.length > 1 ? (
          <div className="tienda-filter-scroll gap-2 px-4 sm:flex-wrap sm:px-0 sm:mask-none">
            {photos.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(i)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-16 sm:w-16 ${
                  i === index
                    ? 'border-accent ring-2 ring-accent/30'
                    : 'border-transparent opacity-75 hover:opacity-100'
                }`}
                aria-label={`Ver imagen ${i + 1}`}
              >
                <Image src={src} alt={`Miniatura ${i + 1}`} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <TiendaModal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={alt}
        kicker="Producto"
        ariaLabel={`Imagen ampliada: ${alt}`}
        size="lg"
        showClose
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-secondary/30">
          <Image src={main} alt={alt} fill className="object-contain" sizes="(max-width: 768px) 100vw, 42rem" />
        </div>
        {photos.length > 1 ? (
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {photos.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(i)}
                className={`relative h-14 w-14 overflow-hidden rounded-lg border-2 transition ${
                  i === index ? 'border-accent' : 'border-border opacity-70 hover:opacity-100'
                }`}
              >
                <Image src={src} alt={`Vista ${i + 1}`} fill className="object-cover" sizes="56px" />
              </button>
            ))}
          </div>
        ) : null}
      </TiendaModal>
    </>
  );
}