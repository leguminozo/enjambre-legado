'use client';

import { useState } from 'react';

type Props = {
  photos: string[];
  alt: string;
};

export function ProductGallery({ photos, alt }: Props) {
  const [index, setIndex] = useState(0);
  const main = photos[index] ?? photos[0];

  if (!main) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl border border-bosque-900/10 bg-cream-100 text-sm text-bosque-800/50">
        Sin foto
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-bosque-900/10 bg-cream-100 shadow-[0_20px_50px_-24px_rgba(10,61,47,0.35)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={alt} className="aspect-square w-full object-cover" />
      </div>
      {photos.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 transition ${
                i === index ? 'border-miel-600 ring-2 ring-miel-600/30' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
