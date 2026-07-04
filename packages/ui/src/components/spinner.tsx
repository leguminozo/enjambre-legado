import React from 'react';
import { HexagonLoader, type HexagonLoaderSize } from './hexagon-loader';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /**
   * `hexagon` — loader canónico del design system (default).
   * `circular` — spinner clásico; **desactivado temporalmente** (ver packages/ui/README.md).
   */
  variant?: 'hexagon' | 'circular';
}

const SIZE_MAP = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
} as const;

const HEX_SIZE: Record<NonNullable<SpinnerProps['size']>, HexagonLoaderSize> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

/** @deprecated Usar `HexagonLoader` o `ViewLoading` directamente. Mantiene API por compatibilidad. */
function CircularSpinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={`
        inline-block rounded-full
        border-primary border-t-transparent
        animate-spin
        ${SIZE_MAP[size]}
        ${className}
      `}
    />
  );
}

/**
 * Loader unificado. Por defecto delega al hexágono (`HexagonLoader`).
 * El variant `circular` se conserva en código pero no se expone activamente.
 */
export function Spinner({ size = 'md', className = '', variant = 'hexagon' }: SpinnerProps) {
  if (variant === 'circular') {
    return <CircularSpinner size={size} className={className} />;
  }

  return (
    <span
      role="status"
      aria-label="Cargando"
      className="inline-flex items-center justify-center shrink-0"
    >
      <HexagonLoader size={HEX_SIZE[size]} className={className} aria-hidden />
    </span>
  );
}