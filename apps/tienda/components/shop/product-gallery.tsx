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
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-sm text-zinc-600">
        Sin foto
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]">
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
              className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition ${
                i === index
                  ? 'border-[#c9a227] ring-2 ring-[#c9a227]/30'
                  : 'border-transparent opacity-75 hover:opacity-100'
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
