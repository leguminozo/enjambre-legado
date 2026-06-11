'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';

interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
}

interface MediaCarouselProps {
  items: MediaItem[];
  autoplayMs?: number;
}

export function MediaCarousel({ items, autoplayMs = 5000 }: MediaCarouselProps) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (idx: number) => {
      const next = ((idx % items.length) + items.length) % items.length;
      setCurrent(next);
    },
    [items.length],
  );

  useEffect(() => {
    if (items.length <= 1) return;
    intervalRef.current = setInterval(() => goTo(current + 1), autoplayMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [current, goTo, items.length, autoplayMs]);

  useEffect(() => {
    if (!trackRef.current) return;
    gsap.to(trackRef.current, {
      xPercent: -100 * current,
      duration: 1.2,
      ease: 'power3.inOut',
    });
  }, [current]);

  if (items.length === 0) {
    return (
      <div className="relative w-full h-[50vh] md:h-[70vh] bg-surface-raised flex items-center justify-center">
        <p className="text-muted-foreground editorial-kicker">Contenido próximamente</p>
      </div>
    );
  }

  return (
    <section className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden bg-surface-sunken">
      <div ref={trackRef} className="flex h-full" style={{ width: `${items.length * 100}%` }}>
        {items.map((item, i) => (
          <div key={i} className="relative h-full flex-shrink-0" style={{ width: `${100 / items.length}%` }}>
                {item.type === 'video' ? (
                  <video
                    src={item.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                <Image
                  src={item.src}
                  alt={item.alt || ''}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  unoptimized
                />
                )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-border bg-card/60 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-base"
            aria-label="Anterior"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-border bg-card/60 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-base"
            aria-label="Siguiente"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all duration-base ${
                  i === current ? 'bg-accent w-6' : 'bg-foreground/30 hover:bg-foreground/50'
                }`}
                aria-label={`Ir a slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
