'use client';

import { useEffect } from 'react';

const OVERLAY_CLASS = 'tienda-overlay-open';

/** Bloquea scroll y oculta chrome inferior cuando hay un panel móvil abierto. */
export function useOverlayLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    document.documentElement.classList.add(OVERLAY_CLASS);
    return () => {
      document.documentElement.classList.remove(OVERLAY_CLASS);
    };
  }, [active]);
}