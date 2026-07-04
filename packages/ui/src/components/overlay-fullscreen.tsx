'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { overlayBackdropClassName } from '../lib/overlay-layer';

export type OverlayFullscreenProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Etiqueta accesible del diálogo (requerida si no hay título visible con id). */
  ariaLabel: string;
  /** Por defecto false — editores fullscreen no deben cerrarse con clic accidental en el fondo. */
  closeOnBackdropClick?: boolean;
  className?: string;
  panelClassName?: string;
};

/**
 * Shell fullscreen para herramientas admin (ej. editor CMS).
 * Comparte backdrop/z-index con Dialog e ImmersiveModal vía overlay-layer.
 */
export function OverlayFullscreen({
  open,
  onClose,
  children,
  ariaLabel,
  closeOnBackdropClick = false,
  className,
  panelClassName,
}: OverlayFullscreenProps) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[220] flex flex-col animate-in fade-in duration-300 motion-reduce:animate-none',
        className,
      )}
    >
      {closeOnBackdropClick ? (
        <button
          type="button"
          className={cn('absolute inset-0', overlayBackdropClassName)}
          aria-label="Cerrar"
          onClick={onClose}
        />
      ) : (
        <div className={cn('absolute inset-0', overlayBackdropClassName)} aria-hidden />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          'relative z-10 flex flex-1 min-h-0 flex-col bg-background border border-border/60 shadow-2xl',
          panelClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}