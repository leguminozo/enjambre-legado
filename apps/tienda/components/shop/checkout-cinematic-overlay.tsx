'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Leaf, Loader2 } from 'lucide-react';

interface CheckoutCinematicOverlayProps {
  open: boolean;
  stalled: boolean;
  onRetry: () => void;
}

/**
 * Transición cinematográfica al iniciar el pago: cubre el checkout mientras la
 * pasarela procesa el redirect (Webpay/Flow). "El bosque aprueba tu compra" con
 * polen dorado y anillos — sin video real para no sumar payload (Safari 15).
 * El redirect corta la página; si se estanca, `stalled` ofrece reintentar.
 */
export function CheckoutCinematicOverlay({ open, stalled, onRetry }: CheckoutCinematicOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cco-backdrop',
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power1.out' },
      );
      gsap.fromTo(
        '.cco-core',
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 0.9, delay: 0.1, ease: 'back.out(1.6)' },
      );
      gsap.fromTo(
        '.cco-title',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.25, ease: 'power2.out' },
      );
      gsap.fromTo(
        '.cco-sub',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.4, ease: 'power2.out' },
      );

      // Polen dorado flotando alrededor del núcleo (GSAP, sin canvas)
      for (let i = 0; i < 24; i++) {
        const pollen = document.createElement('span');
        pollen.className = 'absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-accent/70';
        rootRef.current?.appendChild(pollen);
        gsap.fromTo(
          pollen,
          { x: 0, y: 0, opacity: 0, scale: 0 },
          {
            x: (Math.random() - 0.5) * 420,
            y: (Math.random() - 0.5) * 420,
            opacity: 0.4 + Math.random() * 0.5,
            scale: 0.5 + Math.random() * 0.9,
            duration: 1.4 + Math.random() * 1.8,
            ease: 'power2.out',
            onComplete: () => pollen.remove(),
          },
        );
      }
    }, rootRef);

    return () => ctx.revert();
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-label="Procesando el pago"
      className="fixed inset-0 z-[90] overflow-hidden pointer-events-none"
    >
      <div className="cco-backdrop absolute inset-0 bg-background/95 backdrop-blur-md" />

      {/* Brumas del bosque */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        aria-hidden
      />

      <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="cco-core relative flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-accent/30 animate-ping" aria-hidden />
          <span
            className="absolute -inset-3 rounded-full border border-accent/15 animate-ping [animation-delay:0.4s]"
            aria-hidden
          />
          <div className="relative w-20 h-20 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Leaf className="w-9 h-9 text-accent" strokeWidth={1.5} />
          </div>
        </div>

        <h2 className="cco-title font-display text-2xl sm:text-3xl font-semibold text-foreground mt-8 text-balance">
          El bosque aprueba tu compra
        </h2>
        <p className="cco-sub text-sm sm:text-base text-muted-foreground mt-3 max-w-md">
          {stalled ? (
            <>
              Si no fuiste redirigido,{' '}
              <button
                type="button"
                onClick={onRetry}
                className="pointer-events-auto inline-flex min-h-11 items-center text-accent underline underline-offset-2 px-1"
              >
                reintenta
              </button>
              .
            </>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-accent" />
              Conectando con la pasarela de pago…
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
