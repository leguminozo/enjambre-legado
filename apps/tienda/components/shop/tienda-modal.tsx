'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useOverlayLock } from '@/lib/hooks/use-overlay-lock';

type TiendaModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  kicker?: string;
  subtitle?: string;
  footer?: ReactNode;
  ariaLabel?: string;
  showClose?: boolean;
  size?: 'md' | 'lg';
  headerExtra?: ReactNode;
};

export function TiendaModal({
  open,
  onClose,
  children,
  title,
  kicker,
  subtitle,
  footer,
  ariaLabel = 'Diálogo',
  showClose = true,
  size = 'md',
  headerExtra,
}: TiendaModalProps) {
  useOverlayLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const hasHeader = Boolean(title || kicker || subtitle || showClose || headerExtra);

  return createPortal(
    <div className="tienda-modal-root">
      <button
        type="button"
        className="tienda-modal-backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className={`tienda-modal-panel ${size === 'lg' ? 'is-lg' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {hasHeader && (
          <div className="tienda-modal-header">
            <div className="min-w-0 flex-1">
              {kicker && <p className="tienda-modal-kicker">{kicker}</p>}
              {title && <h3 className="font-display text-lg text-foreground">{title}</h3>}
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
              {headerExtra}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="tienda-modal-close"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="tienda-modal-body">{children}</div>
        {footer ? <div className="tienda-modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}