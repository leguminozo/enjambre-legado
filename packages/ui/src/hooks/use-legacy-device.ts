'use client';

import { useEffect, useState } from 'react';

/**
 * Lee el tier legacy seteado por LegacyDeviceDetect en <html>:
 * data-legacy="true" (hardware antiguo / iOS ≤ 15 / override ?legacy=1) y
 * data-motion="reduce" (prefers-reduced-motion).
 *
 * Gatear componentes pesados con este hook en vez de duplicar matchMedia/UA:
 * - canvas/WebGL (BeeCanvas, GemeloApiario) → fallback estático
 * - mapas Leaflet, partículas animadas, cursor custom → versión ligera
 * - scripts de realtime/sync → modo conservador
 *
 * La detección real corre en el script inline del layout (pre-hidratación);
 * el hook solo observa los atributos (MutationObserver) para no recalcular.
 */

export interface LegacyDeviceState {
  legacy: boolean;
  motionReduced: boolean;
}

function readState(): LegacyDeviceState {
  if (typeof document === 'undefined') return { legacy: false, motionReduced: false };
  const el = document.documentElement;
  return {
    legacy: el.getAttribute('data-legacy') === 'true',
    motionReduced: el.getAttribute('data-motion') === 'reduce',
  };
}

export function useLegacyDevice(): LegacyDeviceState {
  const [state, setState] = useState<LegacyDeviceState>(readState);

  useEffect(() => {
    const el = document.documentElement;
    // El detector inline corre antes de hidratar; el observer cubre overrides
    // posteriores (?legacy=1 en SPA navigation, cambios de reduced-motion).
    const mo = new MutationObserver(() => setState(readState()));
    mo.observe(el, { attributes: true, attributeFilter: ['data-legacy', 'data-motion'] });

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => {
      // Mantener data-motion sincronizado aunque el usuario lo cambie en vivo.
      if (mq.matches) el.setAttribute('data-motion', 'reduce');
      else el.removeAttribute('data-motion');
      setState(readState());
    };
    mq.addEventListener('change', onMotionChange);

    return () => {
      mo.disconnect();
      mq.removeEventListener('change', onMotionChange);
    };
  }, []);

  return state;
}
