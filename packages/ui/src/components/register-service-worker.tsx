'use client';

import { useEffect } from 'react';

export interface RegisterServiceWorkerProps {
  swPath?: string;
  force?: boolean;
}

export function RegisterServiceWorker({ swPath = '/sw.js', force = false }: RegisterServiceWorkerProps = {}) {
  useEffect(() => {
    // Evita registrar Service Worker en desarrollo salvo override explícito
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (!force && process.env.NODE_ENV === 'development') return;

    void navigator.serviceWorker
      .register(swPath, { updateViaCache: 'none' })
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch(() => {
        // Silencioso: no interrumpe la navegación si el navegador bloquea service workers
      });
  }, [swPath, force]);

  return null;
}
