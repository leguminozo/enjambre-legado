'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { FormatFrame } from '@/lib/b2b/segment-content';

/** Three-frame formatos strip — hides broken assets via onError. */
export function FormatImagesRow({
  frames,
  title = 'Formatos',
}: {
  frames: FormatFrame[];
  title?: string;
}) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const visible = frames.filter((f) => !hidden[f.src]);
  if (visible.length === 0) return null;

  return (
    <section className="py-16 px-4 border-t border-border/20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent-text mb-4">
            Visual
          </span>
          <h2 className="font-display text-[clamp(1.35rem,4.5vw,1.85rem)] font-light text-foreground">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {visible.map((frame) => (
            <figure
              key={frame.src}
              className="rounded-xl border border-border/30 bg-surface-raised overflow-hidden"
            >
              <div className="relative aspect-[4/3] bg-surface-sunken">
                <Image
                  src={frame.src}
                  alt={frame.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                  onError={() =>
                    setHidden((prev) => ({ ...prev, [frame.src]: true }))
                  }
                />
              </div>
              <figcaption className="px-4 py-3 text-center text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                {frame.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
