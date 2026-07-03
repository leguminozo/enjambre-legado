'use client';

import React from 'react';
import { HexagonLoader, type HexagonLoaderSize } from './hexagon-loader';

export type ViewLoadingVariant = 'inline' | 'view' | 'page' | 'fullscreen';

const VARIANT_CLASS: Record<ViewLoadingVariant, string> = {
  inline: 'inline-flex flex-col items-center justify-center gap-2.5',
  view: 'flex flex-col items-center justify-center gap-4 py-16 min-h-[12rem] w-full',
  page: 'flex flex-col items-center justify-center gap-4 min-h-[50vh] w-full',
  fullscreen:
    'fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-background/95 backdrop-blur-sm',
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
}: {
  label?: string;
  variant?: ViewLoadingVariant;
  className?: string;
  hideLabel?: boolean;
}) {
  const ariaLabel = label ?? 'Cargando';

  return (
    <div
      className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <HexagonLoader size={SIZE_BY_VARIANT[variant]} aria-hidden />
      {!hideLabel && label ? (
        <p className="text-[0.62rem] uppercase tracking-[0.32em] text-muted-foreground/75 font-medium text-center max-w-[16rem]">
          {label}
        </p>
      ) : null}
    </div>
  );
}

/** Mantiene contenido visible mientras refetch (ej. cambio de rango en dashboards). */
export function LoadingOverlay({ label = 'Actualizando' }: { label?: string }) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-start justify-center pt-10 bg-background/35 backdrop-blur-[1px] pointer-events-none rounded-[inherit]"
      aria-hidden
    >
      <ViewLoading variant="inline" label={label} hideLabel />
    </div>
  );
}

export function ViewLoadingFallback({ label = 'Cargando módulo' }: { label?: string }) {
  return <ViewLoading label={label} variant="view" hideLabel />;
}

/** Solo para módulos cliente (ej. lazyView). En Server Components usar `<ViewLoadingFallback />`. */
export function viewLoadingFallback(label = 'Cargando módulo') {
  return <ViewLoadingFallback label={label} />;
}