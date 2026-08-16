'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { HomeMediaItem, MediaSettings } from '@/lib/shop/store-chrome';

interface MediaCarouselProps {
  items: HomeMediaItem[];
  autoplayMs?: number;
  settings?: MediaSettings;
}

const heightClassMap: Record<string, string> = {
  '50vh/70vh': 'h-[50vh] md:h-[70vh]',
  '40vh/60vh': 'h-[40vh] md:h-[60vh]',
  '60vh/80vh': 'h-[60vh] md:h-[80vh]',
  '70vh/90vh': 'h-[70vh] md:h-[90vh]',
};

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
  );
  return match ? match[1] : null;
}

export function MediaCarousel({ items, autoplayMs = 5000, settings }: MediaCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const effectiveAutoplayMs = settings?.autoplay_ms ?? autoplayMs;
  const heightClass = heightClassMap[settings?.carousel_height || ''] || 'h-[50vh] md:h-[70vh]';
  const isContain = settings?.image_fit === 'contain';
  const fitClass = isContain ? 'object-contain' : 'object-cover object-center';
  const isPaused = isHovered || isFocused;

  const goTo = useCallback(
    (idx: number) => {
      const next = ((idx % items.length) + items.length) % items.length;
      setCurrent(next);
    },
    [items.length],
  );

  useEffect(() => {
    if (items.length <= 1 || isPaused || effectiveAutoplayMs <= 0) return;
    intervalRef.current = setInterval(() => goTo(current + 1), effectiveAutoplayMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [current, goTo, items.length, effectiveAutoplayMs, isPaused]);

  useEffect(() => {
    if (!trackRef.current || items.length === 0) return;
    import('gsap').then((mod) => {
      mod.gsap.to(trackRef.current, {
        xPercent: -(100 / items.length) * current,
        duration: 1.2,
        ease: 'power3.inOut',
      });
    });
  }, [current, items.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        goTo(current - 1);
      } else {
        goTo(current + 1);
      }
    }
    touchStartXRef.current = null;
  };

  if (items.length === 0) {
    return (
      <div className={`relative w-full ${heightClass} bg-surface-raised flex items-center justify-center`}>
        <p className="text-muted-foreground editorial-kicker">Contenido próximamente</p>
      </div>
    );
  }

  return (
    <section
      className={`relative w-full ${heightClass} overflow-hidden bg-surface-sunken select-none`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={trackRef} className="flex h-full" style={{ width: `${items.length * 100}%` }}>
        {items.map((item, i) => {
          const hasCopy = Boolean(item.kicker || item.title || item.subtitle || item.cta_label);
          const ytId = item.type === 'video' ? getYouTubeId(item.src) : null;
          return (
            <div key={i} className="relative h-full flex-shrink-0 overflow-hidden" style={{ width: `${100 / items.length}%` }}>
              {item.type === 'video' ? (
                ytId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1`}
                    title={item.title || item.alt || 'Video'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                  />
                ) : (
                  <video
                    src={item.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className={`h-full w-full ${fitClass}`}
                  />
                )
              ) : (
                <>
                  {isContain ? (
                    <Image
                      src={item.src || '/assets/editorial/immersion.png'}
                      alt=""
                      fill
                      priority={false}
                      sizes="100vw"
                      aria-hidden="true"
                      className="object-cover blur-2xl opacity-30 scale-110 pointer-events-none"
                    />
                  ) : null}
                  <Image
                    src={item.src || '/assets/editorial/immersion.png'}
                    alt={item.alt || item.title || ''}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className={fitClass}
                  />
                </>
              )}
              {/* Degradado adaptativo: más pronunciado si hay texto para legibilidad, sutil si es solo fotografía */}
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-base ${
                  hasCopy
                    ? 'bg-gradient-to-t from-background/90 via-background/40 to-transparent'
                    : 'bg-gradient-to-t from-background/25 via-transparent to-transparent'
                }`}
              />

              {/* Superposición Editorial Opcional */}
              {hasCopy ? (
                <div className="absolute inset-x-0 bottom-12 sm:bottom-16 px-6 sm:px-12 max-w-4xl mx-auto text-center z-10 pointer-events-auto">
                  {item.kicker ? (
                    <span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent-text mb-2 font-medium">
                      {item.kicker}
                    </span>
                  ) : null}
                  {item.title ? (
                    <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-light text-foreground mb-2 text-balance leading-tight">
                      {item.title}
                    </h2>
                  ) : null}
                  {item.subtitle ? (
                    <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-xl mx-auto text-pretty line-clamp-2">
                      {item.subtitle}
                    </p>
                  ) : null}
                  {item.cta_label ? (
                    <Link
                      href={item.cta_link || '/catalogo'}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-widest font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-base shadow-lg"
                    >
                      <span>{item.cta_label}</span>
                      <ArrowRight size={14} />
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 min-h-11 min-w-11 h-11 w-11 rounded-full border border-border bg-card/70 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-base z-20"
            aria-label="Anterior"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 min-h-11 min-w-11 h-11 w-11 rounded-full border border-border bg-card/70 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-base z-20"
            aria-label="Siguiente"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
            {items.map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => goTo(i)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center"
                aria-label={`Ir a slide ${i + 1}`}
                aria-current={i === current ? 'true' : undefined}
              >
                <span
                  className={`block h-2 rounded-full overflow-hidden transition-all duration-base relative ${
                    i === current ? 'w-8 bg-accent/40' : 'w-2 bg-foreground/30'
                  }`}
                >
                  {i === current ? (
                    <span
                      className={`block h-full bg-accent transition-all ${
                        isPaused ? 'w-full opacity-80' : 'w-full animate-pulse'
                      }`}
                    />
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
