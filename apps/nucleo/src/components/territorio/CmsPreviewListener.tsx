'use client';

import { useEffect } from 'react';

/**
 * Listener de sincronización para el iframe del Editor CMS en Núcleo.
 * Permite que, al editar secciones en el panel, el lienzo responda a:
 * - `CMS_SELECT`: scroll automático hacia la sección seleccionada.
 * - `CMS_UPDATE`: recarga suave del contenido modificado.
 */
const RELOAD_DEBOUNCE_MS = 350;
const SELECTED_CLASS = 'ring-2 ring-accent/60 transition-all';

export function CmsPreviewListener() {
  useEffect(() => {
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;

    const handleMessage = (event: MessageEvent) => {
      if (typeof window === 'undefined' || event.source !== window.parent) return;

      const type = event.data?.type;

      if (type === 'CMS_SELECT' && typeof event.data.sectionId === 'string') {
        const id = event.data.sectionId;
        const target = document.querySelector(`[data-cms-section="${id}"]`);
        if (target instanceof HTMLElement) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          target.classList.add(...SELECTED_CLASS.split(' '));
          setTimeout(() => {
            target.classList.remove(...SELECTED_CLASS.split(' '));
          }, 1500);
        }
        return;
      }

      if (type === 'CMS_UPDATE') {
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('_cms', String(Date.now()));
            window.location.replace(url.toString());
          } catch {
            window.location.reload();
          }
        }, RELOAD_DEBOUNCE_MS);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (reloadTimer) clearTimeout(reloadTimer);
    };
  }, []);

  return null;
}
