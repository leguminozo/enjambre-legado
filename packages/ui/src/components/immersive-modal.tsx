'use client';

import React, { useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { overlayBackdropClassName } from '../lib/overlay-layer';
import { useModalFocusTrap } from '../lib/modal-focus';

export type ImmersiveModalSize = 'md' | 'lg' | 'xl' | 'full';

const SIZE_CLASS: Record<ImmersiveModalSize, string> = {
  md: 'max-w-lg h-auto max-h-[min(88vh,640px)]',
  lg: 'max-w-3xl h-[min(88vh,720px)]',
  xl: 'max-w-6xl h-[min(92vh,880px)]',
  full: 'max-w-[min(96vw,1400px)] h-[min(92vh,920px)]',
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
  size = 'xl',
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
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6">
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
        className={`relative z-10 flex w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl animate-in zoom-in-95 duration-300 ${SIZE_CLASS[size]} ${className}`.trim()}
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6 shrink-0">
          <div>
            {eyebrow ? (
              <p className="text-[0.62rem] uppercase tracking-[0.32em] text-muted-foreground">{eyebrow}</p>
            ) : null}
            <h2 id={labelledBy} className="text-lg font-display text-foreground">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar módulo"
          >
            <X size={18} />
          </button>
        </header>

        {hasAside ? (
          <div className={`grid flex-1 min-h-0 lg:grid-cols-[1.1fr_0.9fr] ${bodyClassName}`.trim()}>
            <div className="overflow-y-auto p-5 sm:p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-border">
              {children}
            </div>
            <div className="flex min-h-[200px] flex-col overflow-y-auto p-5 sm:p-6 bg-surface-sunken/30">
              {aside}
            </div>
          </div>
        ) : (
          <div className={`flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 ${bodyClassName}`.trim()}>
            {children}
          </div>
        )}

        {footer ? (
          <footer className="flex w-full items-center justify-end gap-2 border-t border-border px-5 py-4 sm:px-6 shrink-0">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}