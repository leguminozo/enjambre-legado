'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { resolveLocalized } from '@/lib/shop/store-chrome';

const STORAGE_KEY = 'oyz-carousel-dismissed';

function setCarouselHeightVar(height: number) {
  document.documentElement.style.setProperty('--carousel-h', `${height}px`);
}

export function TextCarousel() {
  const locale = useLocale();
  const { announcement, announcementSlides } = useStoreChrome();
  const slides = announcementSlides;
  const intervalMs = announcement.interval_ms;

  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [animating, setAnimating] = useState(false);
  // La barra crece con su contenido (mensajes largos + link envuelven): la
  // config height_*_px actúa como mínimo y --carousel-h usa la altura medida.
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // SSR-stable defaults → set real values after mount (evita React #418)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [carouselHeight, setCarouselHeight] = useState(announcement.height_mobile_px);

  useEffect(() => {
    setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const updateH = () => {
      setCarouselHeight(
        window.innerWidth >= 768
          ? announcement.height_desktop_px
          : announcement.height_mobile_px,
      );
    };
    updateH();
    window.addEventListener('resize', updateH);
    return () => window.removeEventListener('resize', updateH);
  }, [announcement.height_desktop_px, announcement.height_mobile_px]);

  // Medir la altura real del carrusel (texto CMS largo puede envolver): el
  // header sticky usa --carousel-h, así que debe coincidir con lo renderizado.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setMeasuredHeight(el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Al desmontar (navegación SPA fuera del home) resetear la var global:
  // si quedara el valor viejo, el header sticky de otras páginas quedaría
  // desplazado 44-56px con contenido pasando por encima.
  useEffect(() => {
    return () => setCarouselHeightVar(0);
  }, []);

  const effectiveHeight = Math.max(carouselHeight, measuredHeight);

  const slideCount = Math.max(slides.length, 1);

  const stopTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimers = useCallback(() => {
    if (prefersReducedMotion || paused || slides.length <= 1) return;
    stopTimers();
    setProgress(0);
    setTimeout(() => {
      if (!paused) setProgress(100);
    }, 50);
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % slideCount);
    }, intervalMs);
  }, [paused, prefersReducedMotion, stopTimers, slides.length, slideCount, intervalMs]);

  useEffect(() => {
    // Sin carrusel visible → var en 0 para que el sticky stack no se desplace.
    if (!announcement.enabled || dismissed || slides.length === 0) {
      setCarouselHeightVar(0);
      return;
    }
    const wasDismissed = sessionStorage.getItem(STORAGE_KEY);
    if (wasDismissed === '1' && announcement.dismissible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(true);
      setCarouselHeightVar(0);
      return;
    }
    setCarouselHeightVar(effectiveHeight);
  }, [dismissed, effectiveHeight, slides.length, announcement.enabled, announcement.dismissible]);

  useEffect(() => {
    if (dismissed || paused) {
      stopTimers();
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startTimers();
    return stopTimers;
  }, [dismissed, paused, startTimers, stopTimers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(0);
    if (!prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimating(true);
      const fadeTimer = setTimeout(() => setAnimating(false), 500);
      return () => clearTimeout(fadeTimer);
    }
  }, [index, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (dismissed) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        setIndex((prev) => (prev + 1) % slideCount);
        stopTimers();
        startTimers();
      } else if (e.key === 'ArrowLeft') {
        setIndex((prev) => (prev - 1 + slideCount) % slideCount);
        stopTimers();
        startTimers();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dismissed, startTimers, stopTimers, slideCount]);

  const handleDismiss = () => {
    if (!announcement.dismissible) return;
    stopTimers();
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      setCarouselHeightVar(0);
      sessionStorage.setItem(STORAGE_KEY, '1');
    }, 300);
  };

  const goNext = () => {
    setIndex((prev) => (prev + 1) % slideCount);
    stopTimers();
    startTimers();
  };

  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    touchTimeoutRef.current = setTimeout(() => setPaused(false), 3000);
  };

  if (!announcement.enabled || dismissed || slides.length === 0) return null;

  const slide = slides[index % slides.length];
  const text = resolveLocalized(slide.text, slide.text_en, locale);
  const linkLabel = resolveLocalized(
    slide.link_label ?? '',
    slide.link_label_en,
    locale,
  );

  return (
    <div
      ref={barRef}
      role="region"
      aria-label="Mensajes del sitio"
      aria-live="polite"
      className={`tienda-text-carousel sticky top-0 z-[70] bg-surface-sunken/95 border-b border-border/50 backdrop-blur-md transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div
        className="relative flex items-center justify-center overflow-hidden cursor-pointer select-none group"
        style={{ minHeight: `${Math.max(carouselHeight, 44)}px` }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={handleTouchEnd}
        onClick={() => goNext()}
      >
        <div
          className={`text-center font-display italic text-foreground/90 tracking-wide px-12 sm:px-14 transition-opacity duration-500 ease-in-out text-xs md:text-sm ${
            animating && !prefersReducedMotion ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span>{text}</span>
          {slide.href && linkLabel ? (
            (() => {
              const href = slide.href;
              const isExternal = /^https?:\/\//i.test(href) || href.startsWith('//');
              const linkClass =
                'inline-flex min-h-11 items-center ml-1 text-accent-text underline underline-offset-4 decoration-accent/40 hover:decoration-accent transition-colors duration-300 font-semibold not-italic';
              if (isExternal) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={linkClass}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {linkLabel}
                  </a>
                );
              }
              return (
                <Link
                  href={href}
                  className={linkClass}
                  onClick={(e) => e.stopPropagation()}
                >
                  {linkLabel}
                </Link>
              );
            })()
          ) : null}
        </div>

        {announcement.dismissible ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors z-10"
            aria-label="Cerrar anuncio"
          >
            <span className="text-lg leading-none" aria-hidden>
              ×
            </span>
          </button>
        ) : null}
      </div>
      <div className="h-[1.5px] w-full bg-border/40">
        <div
          className="h-full bg-accent"
          style={{
            width: `${progress}%`,
            transitionProperty: 'width',
            transitionDuration: progress === 0 ? '0s' : `${intervalMs}ms`,
            transitionTimingFunction: 'linear',
          }}
        />
      </div>
    </div>
  );
}
