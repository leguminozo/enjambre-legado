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
const FADE_MS = 700;
const SLIDE_MS = 400;
const CAROUSEL_HEIGHT = 36;
const CAROUSEL_HEIGHT_MD = 42;

function setCarouselHeightVar(height: number) {
  document.documentElement.style.setProperty('--carousel-h', `${height}px`);
}

export function TextCarousel() {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<'visible' | 'exiting' | 'entering'>('visible');
  const [slideY, setSlideY] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const getCarouselHeight = useCallback(() => {
    if (typeof window === 'undefined') return CAROUSEL_HEIGHT;
    return window.innerWidth >= 768 ? CAROUSEL_HEIGHT_MD : CAROUSEL_HEIGHT;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advance = useCallback(() => {
    if (!mountedRef.current) return;

    if (prefersReducedMotion) {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
      timerRef.current = setTimeout(advance, INTERVAL_MS);
      return;
    }

    setPhase('exiting');

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setCurrent((prev) => (prev + 1) % SLIDES.length);
      setPhase('entering');

      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setPhase('visible');
        timerRef.current = setTimeout(advance, INTERVAL_MS);
      }, SLIDE_MS);
    }, FADE_MS);
  }, [prefersReducedMotion, clearTimer]);

  useEffect(() => {
    mountedRef.current = true;
    setCarouselHeightVar(getCarouselHeight());
    timerRef.current = setTimeout(advance, INTERVAL_MS);

    function onResize() {
      setCarouselHeightVar(getCarouselHeight());
    }
    window.addEventListener('resize', onResize);

    return () => {
      mountedRef.current = false;
      clearTimer();
      window.removeEventListener('resize', onResize);
    };
  }, [advance, clearTimer, getCarouselHeight]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setSlideY(0);
      return;
    }
    if (phase === 'exiting') setSlideY(-6);
    else if (phase === 'entering') setSlideY(6);
    else setSlideY(0);
  }, [phase, prefersReducedMotion]);

  const slide = SLIDES[current];

  const opacity =
    phase === 'visible' ? 1 :
    phase === 'exiting' ? 0 :
    0;

  const transitionDuration = prefersReducedMotion ? '0ms' : phase === 'entering' ? `${SLIDE_MS}ms` : `${FADE_MS}ms`;

  return (
    <div
      role="region"
      aria-label="Mensajes del sitio"
      aria-live="polite"
      className="sticky top-0 z-[70] bg-background border-b border-border"
    >
      <div
        className="relative flex items-center justify-center overflow-hidden select-none"
        style={{ height: `${getCarouselHeight()}px` }}
      >
        <div
          className="text-center font-display italic text-foreground tracking-wide px-10 text-xs md:text-sm"
          style={{
            opacity,
            transform: prefersReducedMotion ? undefined : `translateY(${slideY}px)`,
            transitionProperty: 'opacity, transform',
            transitionDuration,
            transitionTimingFunction: 'ease-in-out',
          }}
        >
          <span>{slide.text}</span>
          {slide.href && slide.linkLabel && (
            <a
              href={slide.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-colors duration-300 font-semibold not-italic"
              onClick={(e) => e.stopPropagation()}
            >
              {slide.linkLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
