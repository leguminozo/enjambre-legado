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
  page: 'flex flex-col items-center justify-center gap-4 min-h-[50vh] w-full mx-auto',
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
}: {
  label?: string;
  variant?: ViewLoadingVariant;
  className?: string;
  hideLabel?: boolean;
  context?: HexagonContext;
}) {
  const ariaLabel = label ?? 'Cargando';
  const containerRef = useRef<HTMLDivElement>(null);
  const isFullscreen = variant === 'fullscreen';

  useGSAP(() => {
    // Animación de entrada cinemática (solo para fullscreen o page)
    if ((variant === 'fullscreen' || variant === 'page') && containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' }
      );
    }
  }, { scope: containerRef, dependencies: [variant] });

  // Determinamos el fondo según el contexto (solo aplicable cuando es un loader grande)
  let bgClass = 'bg-background/95 backdrop-blur-sm';
  if (isFullscreen || variant === 'page') {
    if (context === 'tienda') {
      bgClass = 'bg-surface-sunken/95 backdrop-blur-md bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 to-transparent';
    } else if (context === 'campo') {
      bgClass = 'bg-[#0f1210]/95 backdrop-blur-sm'; 
    } else if (context === 'nucleo') {
      bgClass = 'bg-background/95 backdrop-blur-sm bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 to-background';
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
        <p className="text-[0.62rem] uppercase tracking-[0.32em] text-muted-foreground/75 font-medium text-center max-w-[16rem]">
          {label}
        </p>
      ) : null}
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