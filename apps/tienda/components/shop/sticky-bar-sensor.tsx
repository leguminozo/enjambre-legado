'use client';

import { useEffect } from 'react';

/**
 * Reemplaza los selectores `.tienda-shell:has(.tienda-*)` del CSS (Safari < 15.4
 * no soporta :has() y las barras fijas quedaban tapando el contenido).
 * Expone la presencia de las barras como data-attributes sobre el shell.
 * Nota "why": :has() es estructural (no depende de visibilidad), y esto también:
 * detecta presencia en el DOM, misma semántica.
 */

const SENSORS: Array<[selector: string, attribute: string]> = [
  ['.tienda-cart-bar', 'data-has-cart'],
  ['.tienda-sticky-cta', 'data-has-sticky-cta'],
  ['.tienda-checkout-sticky-pay', 'data-has-sticky-pay'],
];

export function StickyBarSensor() {
  useEffect(() => {
    const shell = document.querySelector('.tienda-shell');
    if (!shell) return;
    const sync = () => {
      for (const [selector, attribute] of SENSORS) {
        shell.setAttribute(attribute, shell.querySelector(selector) ? 'true' : 'false');
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(shell, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
