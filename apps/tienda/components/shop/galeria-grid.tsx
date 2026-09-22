'use client';

import { useState } from 'react';
import Image from 'next/image';
import { TiendaModal } from '@/components/shop/tienda-modal';
import type { GaleriaSettings } from '@/lib/shop/store-chrome';
import { alignToClass } from '@/lib/shop/store-chrome';

export type GaleriaImage = {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
};

const aspectClassMap: Record<string, string> = {
  '16/10': 'aspect-[16/10]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '3/4': 'aspect-[3/4]',
  'auto': 'aspect-auto',
};

const colsClassMap: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

export function GaleriaGrid({
  images,
  settings,
}: {
  images: GaleriaImage[];
  settings?: GaleriaSettings;
}) {
  const [active, setActive] = useState<GaleriaImage | null>(null);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const handleImageError = (url: string) => {
    setFailedUrls((prev) => ({ ...prev, [url]: true }));
  };

  const aspectClass = aspectClassMap[settings?.image_aspect_ratio || ''] || 'aspect-[4/3]';
  const fitClass = settings?.image_fit === 'contain' ? 'object-contain p-2' : 'object-cover';
  const gridColsClass = colsClassMap[settings?.grid_columns || 3] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <>
      <div className={`grid ${gridColsClass} gap-6`}>
        {images.map((img, idx) => (
          <button
            key={img.id || idx}
            type="button"
            onClick={() => img.url && setActive(img)}
            className={`group relative ${aspectClass} overflow-hidden rounded-2xl bg-card border border-border text-left`}
            aria-label={img.titulo ? `Ver ${img.titulo}` : 'Ver imagen de galería'}
          >
            {img.url && !failedUrls[img.url] ? (
              aspectClass === 'aspect-auto' ? (
                <img
                  src={img.url}
                  alt={img.titulo || 'Galería'}
                  className={`${fitClass.includes('p-2') ? 'p-2 ' : ''}w-full h-auto transition-transform duration-700 group-hover:scale-105`}
                  loading="lazy"
                  onError={() => handleImageError(img.url)}
                />
              ) : (
                <Image
                  src={img.url}
                  alt={img.titulo || 'Galería'}
                  fill
                  className={`${fitClass} transition-transform duration-700 group-hover:scale-105`}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  onError={() => handleImageError(img.url)}
                />
              )
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-secondary/50 p-4 text-center text-muted-foreground">
                <span className="font-display text-sm font-medium">{img.titulo || `Imagen ${idx + 1}`}</span>
                <span className="text-[11px] text-muted-foreground/70 mt-0.5">Predio Pureo · Chiloé</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <h3 className="font-display text-lg sm:text-xl text-foreground mb-1">
                  {img.titulo || 'Imagen'}
                </h3>
                {img.descripcion ? (
                  <p className={`text-sm text-muted-foreground line-clamp-2 whitespace-pre-line ${alignToClass(settings?.text_align)}`}>{img.descripcion}</p>
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
        kicker={settings?.kicker || 'Galería'}
        ariaLabel={active?.titulo ? `Imagen: ${active.titulo}` : 'Imagen de galería'}
        size="lg"
      >
        {active?.url && !failedUrls[active.url] ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-secondary/30">
            <Image
              src={active.url}
              alt={active.titulo || 'Galería'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 42rem"
              onError={() => handleImageError(active.url)}
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl bg-secondary/30 p-6 text-center text-muted-foreground">
            <span className="font-display text-base font-medium">{active?.titulo || 'Fotografía de Origen'}</span>
            <span className="text-xs text-muted-foreground/70 mt-1">Predio Pureo · Fiordos de Chiloé</span>
          </div>
        )}
      </TiendaModal>
    </>
  );
}