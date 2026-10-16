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

function inEditorPreview(): boolean {
  try {
    return typeof window !== 'undefined' && window.parent !== window;
  } catch {
    return false;
  }
}

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

    const handleClick = (event: MouseEvent) => {
      if (!inEditorPreview()) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const node = target.closest('[data-cms-section]');
      if (!(node instanceof HTMLElement)) return;
      const sectionId = node.dataset.cmsSection;
      if (!sectionId) return;

      event.preventDefault();
      event.stopPropagation();

      document.querySelectorAll(`.${SELECTED_CLASS.split(' ')[0]}`).forEach((el) => {
        el.classList.remove(...SELECTED_CLASS.split(' '));
      });
      node.classList.add(...SELECTED_CLASS.split(' '));
      setTimeout(() => {
        node.classList.remove(...SELECTED_CLASS.split(' '));
      }, 1500);

      window.parent.postMessage({ type: 'CMS_SECTION_CLICK', sectionId }, '*');
    };

    window.addEventListener('message', handleMessage);
    if (inEditorPreview()) {
      document.addEventListener('click', handleClick, true);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      if (inEditorPreview()) {
        document.removeEventListener('click', handleClick, true);
      }
      if (reloadTimer) clearTimeout(reloadTimer);
    };
  }, []);

  return null;
}
