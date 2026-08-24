'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Redibuja el mapa cuando su contenedor cambia de ancho SIN resize de ventana
 * (colapso/expansión del sidebar, modo foco, densidad). react-leaflet solo
 * invalida el tamaño en window resize; sin esto, las tiles quedan descolocadas
 * o con huecos al expandir el área de trabajo.
 * rAF-throttled: máxima una invalidación por frame (hardware legacy).
 */
export function MapResizeWatcher() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    let pending = false;
    let isCleanedUp = false;
    const onResize = () => {
      if (pending || isCleanedUp) return;
      pending = true;
      requestAnimationFrame(() => {
        if (isCleanedUp) return;
        pending = false;
        map.invalidateSize();
      });
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(container);
    return () => {
      isCleanedUp = true;
      observer.disconnect();
    };
  }, [map]);

  return null;
}
