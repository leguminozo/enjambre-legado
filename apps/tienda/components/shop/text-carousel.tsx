'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (!announcement.enabled || dismissed) return;
    const wasDismissed = sessionStorage.getItem(STORAGE_KEY);
    if (wasDismissed === '1' && announcement.dismissible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(true);
      setCarouselHeightVar(0);
      return;
    }
    setCarouselHeightVar(carouselHeight);
  }, [dismissed, carouselHeight, announcement.enabled, announcement.dismissible]);

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
      role="region"
      aria-label="Mensajes del sitio"
      aria-live="polite"
      className={`tienda-text-carousel sticky top-0 z-[70] bg-bosque transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div
        className="relative flex items-center justify-center overflow-hidden cursor-pointer select-none group"
        style={{ height: `${carouselHeight}px` }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (e.detail === 2) handleDismiss();
          else goNext();
        }}
      >
        <div
          className={`text-center font-display italic text-crema tracking-wide px-10 transition-opacity duration-500 ease-in-out text-xs md:text-sm ${
            animating && !prefersReducedMotion ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span>{text}</span>
          {slide.href && linkLabel ? (
            <a
              href={slide.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-miel underline underline-offset-4 decoration-miel/40 hover:decoration-miel transition-colors duration-300 font-semibold not-italic"
              onClick={(e) => e.stopPropagation()}
            >
              {linkLabel}
            </a>
          ) : null}
        </div>

        {announcement.dismissible ? (
          <span className="absolute right-3 text-[0.5rem] uppercase tracking-[0.2em] text-crema/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            doble clic para cerrar
          </span>
        ) : null}
      </div>
      <div className="h-[1.5px] w-full bg-bosque-dark/60">
        <div
          className="h-full bg-miel"
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
