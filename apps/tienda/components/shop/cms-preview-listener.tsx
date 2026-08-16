'use client';

import { useEffect } from 'react';

/**
 * Preview del Editor de Tienda (iframe).
 * - CMS_UPDATE: recarga para re-leer CMS (debounce).
 * - CMS_SELECT: scroll + outline de [data-cms-section].
 * - Clic en sección → CMS_SECTION_CLICK al parent.
 */
const RELOAD_DEBOUNCE_MS = 400;
const SELECTED_CLASS = 'cms-section-selected';

function inEditorPreview(): boolean {
  try {
    return window.parent !== window;
  } catch {
    return false;
  }
}

function applySectionSelect(sectionId: string) {
  document.querySelectorAll(`.${SELECTED_CLASS}`).forEach((el) => {
    el.classList.remove(SELECTED_CLASS);
  });
  const node = document.querySelector(`[data-cms-section="${CSS.escape(sectionId)}"]`);
  if (!(node instanceof HTMLElement)) return;
  node.classList.add(SELECTED_CLASS);
  node.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function CmsPreviewListener() {
  useEffect(() => {
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;

    const scrollKey = `cms-scroll-${window.location.pathname}`;
    const restoreScroll = () => {
      try {
        const saved = sessionStorage.getItem(scrollKey);
        if (saved) window.scrollTo(0, Number(saved));
      } catch {
        /* sessionStorage bloqueado */
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const type = event.data?.type;

      if (type === 'CMS_SELECT' && typeof event.data.sectionId === 'string') {
        applySectionSelect(event.data.sectionId);
        return;
      }

      if (type !== 'CMS_UPDATE') return;

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
      applySectionSelect(sectionId);
      window.parent.postMessage({ type: 'CMS_SECTION_CLICK', sectionId }, '*');
    };

    restoreScroll();
    window.addEventListener('message', handleMessage);
    if (inEditorPreview()) {
      document.documentElement.classList.add('cms-preview');
      document.addEventListener('click', handleClick, true);
    }
    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('click', handleClick, true);
      if (reloadTimer) clearTimeout(reloadTimer);
    };
  }, []);

  return null;
}
