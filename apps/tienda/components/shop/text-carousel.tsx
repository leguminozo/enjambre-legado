'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface SlideData {
  text: string;
  href?: string;
  linkLabel?: string;
}

const SLIDES: SlideData[] = [
  { text: 'Bienvenido a la experiencia digital. Te estábamos esperando' },
  {
    text: 'La historia del bosque comienza ',
    href: 'https://www.obrerayzangano.com/nuestra-historia-or-apicultura-regenerativa-en-chiloe/',
    linkLabel: 'aquí',
  },
  { text: 'Directo del bosque a tu hogar' },
  { text: 'Hecho artesanalmente. Ritmo naturaleza' },
  { text: 'Consume menos. Consume mejor' },
  { text: 'Cada gota regenera bosque nativo' },
  { text: 'Nuestra miel no es producto, es legado' },
  { text: 'Cada verano, un nuevo comienzo' },
  { text: 'Envío gratis comprando desde $55.000' },
  {
    text: 'Aún nos estamos construyendo. Si ocurre algo, pincha ',
    href: 'https://api.whatsapp.com/send?phone=56940831358',
    linkLabel: 'aquí',
  },
];

const INTERVAL_MS = 5000;
const STORAGE_KEY = 'oyz-carousel-dismissed';
const CAROUSEL_HEIGHT = 36;
const CAROUSEL_HEIGHT_MD = 42;

function setCarouselHeightVar(height: number) {
  document.documentElement.style.setProperty('--carousel-h', `${height}px`);
}

export function TextCarousel() {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef(0);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const getCarouselHeight = useCallback(() => {
    if (typeof window === 'undefined') return CAROUSEL_HEIGHT;
    return window.innerWidth >= 768 ? CAROUSEL_HEIGHT_MD : CAROUSEL_HEIGHT;
  }, []);

  const stopTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    timerRef.current = null;
    progressRef.current = null;
    elapsedRef.current = 0;
  }, []);

  const startTimers = useCallback(() => {
    if (prefersReducedMotion || paused) return;
    stopTimers();

    setProgress(0);
    // Pequeño delay para asegurar que el 0% se aplique sin transición si veníamos de un valor alto
    setTimeout(() => {
      if (!paused) setProgress(100);
    }, 50);

    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, INTERVAL_MS);
  }, [paused, prefersReducedMotion, stopTimers]);

  useEffect(() => {
    if (dismissed) return;
    const wasDismissed = sessionStorage.getItem(STORAGE_KEY);
    if (wasDismissed === '1') {
      setDismissed(true);
      setCarouselHeightVar(0);
      return;
    }
    setCarouselHeightVar(getCarouselHeight());
  }, [dismissed, getCarouselHeight]);

  useEffect(() => {
    if (dismissed) {
      setCarouselHeightVar(0);
      return;
    }
    setCarouselHeightVar(getCarouselHeight());

    function onResize() {
      if (!dismissed) setCarouselHeightVar(getCarouselHeight());
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [dismissed, getCarouselHeight]);

  useEffect(() => {
    if (dismissed || paused) {
      stopTimers();
      return;
    }
    startTimers();
    return stopTimers;
  }, [dismissed, paused, startTimers, stopTimers]);

  useEffect(() => {
    setProgress(0);
    if (!prefersReducedMotion) {
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
        setIndex((prev) => (prev + 1) % SLIDES.length);
        stopTimers();
        startTimers();
      } else if (e.key === 'ArrowLeft') {
        setIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
        stopTimers();
        startTimers();
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dismissed, startTimers, stopTimers]);

  const handleDismiss = () => {
    stopTimers();
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      setCarouselHeightVar(0);
      sessionStorage.setItem(STORAGE_KEY, '1');
    }, 300);
  };

  const goNext = () => {
    setIndex((prev) => (prev + 1) % SLIDES.length);
    stopTimers();
    startTimers();
  };

  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    touchTimeoutRef.current = setTimeout(() => setPaused(false), 3000);
  };

  if (dismissed) return null;

  const slide = SLIDES[index];

  return (
    <div
      role="region"
      aria-label="Mensajes del sitio"
      aria-live="polite"
      className={`sticky top-0 z-[70] bg-bosque transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div
        className="relative flex items-center justify-center overflow-hidden cursor-pointer select-none group"
        style={{ height: `${getCarouselHeight()}px` }}
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
          <span>{slide.text}</span>
          {slide.href && slide.linkLabel && (
            <a
              href={slide.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-miel underline underline-offset-4 decoration-miel/40 hover:decoration-miel transition-colors duration-300 font-semibold not-italic"
              onClick={(e) => e.stopPropagation()}
            >
              {slide.linkLabel}
            </a>
          )}
        </div>

        <span className="absolute right-3 text-[0.5rem] uppercase tracking-[0.2em] text-crema/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          doble clic para cerrar
        </span>
      </div>
      <div className="h-[1.5px] w-full bg-bosque-dark/60">
        <div
          className="h-full bg-miel"
          style={{
            width: `${progress}%`,
            transitionProperty: 'width',
            transitionDuration: progress === 0 ? '0s' : `${INTERVAL_MS}ms`,
            transitionTimingFunction: 'linear'
          }}
        />
      </div>
    </div>
  );
}
