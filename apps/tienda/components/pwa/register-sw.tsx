'use client';

import { useEffect } from 'react';

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    void navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch(() => {
        // No bloquea la experiencia si falla el registro.
      });
  }, []);

  return null;
}

