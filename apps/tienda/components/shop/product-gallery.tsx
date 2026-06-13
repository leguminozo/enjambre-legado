'use client';

import { useState } from 'react';
import Image from 'next/image';

type Props = {
  photos: string[];
  alt: string;
};

export function ProductGallery({ photos, alt }: Props) {
  const [index, setIndex] = useState(0);
  const main = photos[index] ?? photos[0];

  if (!main) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground/60">
        Sin foto
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <Image src={main} alt={alt} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      {photos.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition ${
                i === index
                  ? 'border-accent ring-2 ring-accent/30'
                  : 'border-transparent opacity-75 hover:opacity-100'
              }`}
            >
              <Image src={src} alt={`Miniatura ${i + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
