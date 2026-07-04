'use client';

import { useEffect } from 'react';
import { usePwaStandalone } from '@/lib/hooks/use-pwa-standalone';

/** Sincroniza data-tienda-pwa en <html> para CSS (padding, cart bar, WhatsApp). */
export function PwaShellMarker() {
  const standalone = usePwaStandalone();

  useEffect(() => {
    const root = document.documentElement;
    if (standalone) {
      root.setAttribute('data-tienda-pwa', 'standalone');
    } else {
      root.removeAttribute('data-tienda-pwa');
    }
  }, [standalone]);

  return null;
}