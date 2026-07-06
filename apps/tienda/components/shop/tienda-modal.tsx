'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModalFocusTrap } from '@enjambre/ui';
import { useOverlayLock } from '@/lib/hooks/use-overlay-lock';

type TiendaModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  titleId?: string;
  kicker?: string;
  subtitle?: string;
  footer?: ReactNode;
  /** Fallback cuando no hay `title` (galería sin título, etc.) */
  ariaLabel?: string;
  showClose?: boolean;
  size?: 'md' | 'lg';
  headerExtra?: ReactNode;
  testId?: string;
};

export function TiendaModal({
  open,
  onClose,
  children,
  title,
  titleId,
  kicker,
  subtitle,
  footer,
  ariaLabel = 'Diálogo',
  showClose = true,
  size = 'md',
  headerExtra,
  testId,
}: TiendaModalProps) {
  const autoTitleId = useId();
  const labelledBy = title != null && title !== '' ? (titleId ?? autoTitleId) : undefined;
  const panelRef = useRef<HTMLDivElement>(null);

  useOverlayLock(open);
  useModalFocusTrap({ open, onClose, containerRef: panelRef });

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
        ref={panelRef}
        data-testid={testId}
        className={`tienda-modal-panel ${size === 'lg' ? 'is-lg' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : ariaLabel}
        tabIndex={-1}
      >
        {hasHeader && (
          <div className="tienda-modal-header">
            <div className="min-w-0 flex-1">
              {kicker && <p className="tienda-modal-kicker">{kicker}</p>}
              {title != null && title !== '' && (
                <h3 id={labelledBy} className="font-display text-lg text-foreground">
                  {title}
                </h3>
              )}
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