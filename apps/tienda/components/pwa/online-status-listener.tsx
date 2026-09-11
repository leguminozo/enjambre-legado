'use client';

import { useEffect, useRef } from 'react';
import { toast } from '@enjambre/ui';

/**
 * Escucha cambios en la conectividad del dispositivo (iOS/Android/Desktop)
 * y notifica con tono sobrio y biocultural sin tecnicismos ni jerga de red.
 */
export function OnlineStatusListener() {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      toast.warning('Modo fuera de línea activo · Puedes seguir explorando las páginas cargadas', {
        duration: 5000,
      });
    };

    const handleOnline = () => {
      if (isFirstRender.current) return;
      toast.success('Conexión restablecida', {
        duration: 3500,
      });
    };

    isFirstRender.current = false;

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}
