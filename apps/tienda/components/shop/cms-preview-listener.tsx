'use client';

import { useEffect } from 'react';

/**
 * Editor de Tienda (Núcleo) postMessage { type: 'CMS_UPDATE' }.
 * Hard reload (no solo router.refresh) para re-leer layout brand/menu
 * tras revalidatePath en el servidor.
 */
export function CmsPreviewListener() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'CMS_UPDATE') return;
      // Solo mensajes del parent del iframe del editor
      if (event.source !== window.parent) return;

      try {
        const url = new URL(window.location.href);
        url.searchParams.set('_cms', String(Date.now()));
        window.location.replace(url.toString());
      } catch {
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return null;
}
