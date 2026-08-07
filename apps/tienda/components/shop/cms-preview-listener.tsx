'use client';

import { useEffect } from 'react';

/**
 * Editor de Tienda (Núcleo) postMessage { type: 'CMS_UPDATE' }.
 * Hard reload (no solo router.refresh) para re-leer layout brand/menu
 * tras revalidatePath en el servidor.
 *
 * Debounce trailing ~2s: colapsa ráfagas del autosave del editor en un solo
 * reload. El scroll se preserva en sessionStorage por ruta entre reloads
 * (los cambios suelen ser en la sección visible).
 */
const RELOAD_DEBOUNCE_MS = 2000;

export function CmsPreviewListener() {
  useEffect(() => {
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;

    const scrollKey = `cms-scroll-${window.location.pathname}`;
    const restoreScroll = () => {
      try {
        const saved = sessionStorage.getItem(scrollKey);
        if (saved) window.scrollTo(0, Number(saved));
      } catch {
        /* sessionStorage bloqueado: sin preservar scroll */
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'CMS_UPDATE') return;
      // Solo mensajes del parent del iframe del editor
      if (event.source !== window.parent) return;

      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        try {
          sessionStorage.setItem(scrollKey, String(window.scrollY));
        } catch {
          /* sin preservación */
        }
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('_cms', String(Date.now()));
          window.location.replace(url.toString());
        } catch {
          window.location.reload();
        }
      }, RELOAD_DEBOUNCE_MS);
    };

    restoreScroll();
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (reloadTimer) clearTimeout(reloadTimer);
    };
  }, []);

  return null;
}
