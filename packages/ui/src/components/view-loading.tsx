'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { HexagonLoader, type HexagonLoaderSize, type HexagonContext } from './hexagon-loader';

gsap.registerPlugin(useGSAP);

export type ViewLoadingVariant = 'inline' | 'view' | 'page' | 'fullscreen';

const VARIANT_CLASS: Record<ViewLoadingVariant, string> = {
  inline: 'inline-flex flex-col items-center justify-center gap-2.5',
  view: 'flex flex-col items-center justify-center gap-4 py-16 min-h-[12rem] w-full',
  // viewport completo (token --vh-full con fallback 100vh iOS <15.4 → 100dvh modernos).
  // Antes: min-h-[50vh] — el loader quedaba confinado a la mitad superior de la pantalla (se veía cortado).
  page: 'flex flex-col items-center justify-center gap-4 min-h-[var(--vh-full)] w-full mx-auto',
  fullscreen:
    'fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4',
};

const SIZE_BY_VARIANT: Record<ViewLoadingVariant, HexagonLoaderSize> = {
  inline: 'sm',
  view: 'md',
  page: 'lg',
  fullscreen: 'lg',
};

export function ViewLoading({
  label,
  variant = 'view',
  className = '',
  hideLabel = false,
  context = 'default',
  brand,
}: {
  label?: string;
  variant?: ViewLoadingVariant;
  className?: string;
  hideLabel?: boolean;
  context?: HexagonContext;
  /** Wordmark/marca opcional debajo del label (ej. BrandWordmark). */
  brand?: React.ReactNode;
}) {
  const ariaLabel = label ?? 'Cargando';
  const containerRef = useRef<HTMLDivElement>(null);
  const isFullscreen = variant === 'fullscreen';

  useGSAP(() => {
    // Animación de entrada cinemática (solo fullscreen/page, sin prefers-reduced-motion).
    // El blur se limita a ≥768px: filtrar el viewport completo es costoso en móviles legacy (iPhone 7).
    if ((variant === 'fullscreen' || variant === 'page') && containerRef.current) {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const withBlur = window.matchMedia('(min-width: 768px)').matches;
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, scale: 0.95, ...(withBlur ? { filter: 'blur(10px)' } : {}) },
          {
            opacity: 1,
            scale: 1,
            ...(withBlur ? { filter: 'blur(0px)' } : {}),
            duration: 1.2,
            ease: 'power3.out',
          }
        );
      });
      return () => mm.revert();
    }
  }, { scope: containerRef, dependencies: [variant] });

  // Fondos solo con tokens semánticos (Ley III — sin hex / white crudo).
  // backdrop-blur solo en ≥768px: filtrar el fondo a pantalla completa es caro en móviles legacy.
  let bgClass = 'bg-background/95';
  if (isFullscreen || variant === 'page') {
    if (context === 'tienda') {
      bgClass =
        'bg-surface-sunken/95 md:bg-surface-sunken/90 md:backdrop-blur-md bg-[radial-gradient(ellipse_at_top,_hsla(var(--foreground)/0.05),_transparent)]';
    } else if (context === 'campo') {
      bgClass = 'bg-background/95 md:bg-background/90 md:backdrop-blur-sm';
    } else if (context === 'nucleo') {
      bgClass =
        'bg-background/95 md:bg-background/90 md:backdrop-blur-sm bg-[radial-gradient(ellipse_at_center,_hsla(var(--primary)/0.08),_transparent)]';
    }
  }

  return (
    <div
      ref={containerRef}
      className={`${VARIANT_CLASS[variant]} ${(isFullscreen || variant === 'page') ? bgClass : ''} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-center shrink-0" aria-hidden>
        <HexagonLoader size={SIZE_BY_VARIANT[variant]} context={context} />
      </div>
      {!hideLabel && label ? (
        <p className="text-[0.62rem] uppercase tracking-[0.32em] text-muted-foreground font-medium text-center max-w-[16rem] px-4">
          {label}
        </p>
      ) : null}
      {brand ? <div className="mt-1.5">{brand}</div> : null}
    </div>
  );
}

/** Mantiene contenido visible mientras refetch (ej. cambio de rango en dashboards). */
export function LoadingOverlay({ label = 'Actualizando', context = 'default' }: { label?: string, context?: HexagonContext }) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-background/35 backdrop-blur-[1px] pointer-events-none rounded-[inherit]"
      aria-hidden
    >
      <ViewLoading variant="inline" label={label} hideLabel context={context} />
    </div>
  );
}

export function ViewLoadingFallback({ label = 'Cargando módulo', context = 'default' }: { label?: string, context?: HexagonContext }) {
  return <ViewLoading label={label} variant="view" hideLabel context={context} />;
}

/** Solo para módulos cliente (ej. lazyView). En Server Components usar `<ViewLoadingFallback />`. */
export function viewLoadingFallback(label = 'Cargando módulo', context: HexagonContext = 'default') {
  return <ViewLoadingFallback label={label} context={context} />;
}

/** Reserva altura de `view` sin hexágono — evita doble loader tras `dynamic()` o `loading.tsx`. */
export function ViewLoadingPlaceholder({
  label = 'Cargando',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`min-h-[12rem] w-full ${className}`.trim()}
      role="status"
      aria-busy="true"
      aria-label={label}
    />
  );
}