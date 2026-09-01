'use client';

import React, { useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { overlayBackdropClassName } from '../lib/overlay-layer';
import { useModalFocusTrap } from '../lib/modal-focus';

export type ImmersiveModalSize = 'md' | 'lg' | 'xl' | 'full';

/**
 * Tamaños: ancho + tope de altura (no altura forzada).
 * h-auto deja que forms cortos no dejen un vacío de 880px.
 */
const SIZE_CLASS: Record<ImmersiveModalSize, string> = {
  md: 'max-w-lg max-h-[calc(100%-1rem)] sm:max-h-[min(88vh,640px)]',
  lg: 'max-w-3xl max-h-[calc(100%-1rem)] sm:max-h-[min(88vh,720px)]',
  xl: 'max-w-6xl max-h-[calc(100%-1rem)] sm:max-h-[min(92vh,880px)]',
  full: 'max-w-[min(96vw,1400px)] max-h-[calc(100%-1rem)] sm:max-h-[min(92vh,920px)]',
};

export function ImmersiveModal({
  open,
  onClose,
  eyebrow,
  title,
  titleId,
  children,
  footer,
  aside,
  size = 'md',
  className = '',
  bodyClassName = '',
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  titleId?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  aside?: React.ReactNode;
  size?: ImmersiveModalSize;
  className?: string;
  bodyClassName?: string;
}) {
  const autoTitleId = useId();
  const labelledBy = titleId ?? autoTitleId;
  const dialogRef = useRef<HTMLDivElement>(null);

  useModalFocusTrap({
    open,
    onClose,
    containerRef: dialogRef,
    lockBodyScroll: true,
  });

  if (!open) return null;

  const hasAside = Boolean(aside);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[220] flex items-center justify-center overflow-y-auto overscroll-contain',
        'p-3 sm:p-6',
        'pt-[max(0.75rem,env(safe-area-inset-top))]',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
      )}
    >
      {/* Backdrop: click fuera cierra; opacidad alta para enfocar el panel */}
      <button
        type="button"
        className={cn('absolute inset-0', overlayBackdropClassName)}
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex w-full flex-col overflow-hidden',
          'rounded-2xl border border-border bg-card',
          // Sombra + anillo sutil: el panel se despega del fondo oscuro
          'shadow-2xl shadow-black/40 ring-1 ring-white/10',
          'animate-in zoom-in-95 fade-in-0 duration-200',
          // Centrado explícito en el flex del padre; altura al contenido
          'h-auto my-auto',
          SIZE_CLASS[size],
          className,
        )}
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6 shrink-0 bg-card">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[0.62rem] uppercase tracking-[0.32em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={labelledBy}
              className="text-lg font-display text-foreground truncate"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Cerrar módulo"
          >
            <X size={18} />
          </button>
        </header>

        {hasAside ? (
          <div
            className={cn(
              'grid flex-1 min-h-0 overflow-hidden lg:grid-cols-[1.1fr_0.9fr]',
              bodyClassName,
            )}
          >
            <div className="overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-border">
              {children}
            </div>
            <div className="flex min-h-[160px] max-h-[40vh] lg:max-h-none flex-col overflow-y-auto overscroll-contain p-5 sm:p-6 bg-surface-sunken/40">
              {aside}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6',
              bodyClassName,
            )}
          >
            {children}
          </div>
        )}

        {footer ? (
          <footer className="flex w-full flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-5 py-4 sm:px-6 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] [&>*]:min-h-11">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
