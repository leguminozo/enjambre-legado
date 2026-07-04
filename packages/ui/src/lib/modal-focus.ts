'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';

export const MODAL_FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
  );
}

type UseModalFocusTrapOptions = {
  open: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  /** Bloquea scroll en document.body (ImmersiveModal). Tienda usa useOverlayLock aparte. */
  lockBodyScroll?: boolean;
};

/** Escape, tab trap, foco inicial y restauración al cerrar. */
export function useModalFocusTrap({
  open,
  onClose,
  containerRef,
  lockBodyScroll = false,
}: UseModalFocusTrapOptions): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !containerRef.current) return;
    const focusable = getFocusableElements(containerRef.current);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [containerRef]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      trapFocus(e);
    };

    const prevOverflow = lockBodyScroll ? document.body.style.overflow : null;
    if (lockBodyScroll) document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', onKey);
    requestAnimationFrame(() => {
      const root = containerRef.current;
      if (!root) return;
      const focusable = getFocusableElements(root);
      (focusable[0] ?? root).focus();
    });

    return () => {
      if (lockBodyScroll && prevOverflow !== null) {
        document.body.style.overflow = prevOverflow;
      }
      window.removeEventListener('keydown', onKey);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose, trapFocus, lockBodyScroll, containerRef]);
}