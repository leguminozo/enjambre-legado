'use client';

import { useEffect } from 'react';

/**
 * Reemplaza los selectores `.view-deep .card:has(> table)` del CSS (Safari < 15.4
 * no soporta :has() y las tablas desbordaban sus contenedores sin scroll).
 * Expone la presencia de tablas directas como data-attribute sobre el contenedor.
 * Nota "why": :has() es estructural (no depende de visibilidad), y esto también:
 * detecta presencia en el DOM, misma semántica.
 * Extensible: agregar pares [selector, attribute] para nuevas barras/overlays.
 */

const SENSOR_SELECTORS = ['.card', "section", "[class*='CardContent']"];

export function ShellBarSensor() {
  useEffect(() => {
    const root = document.querySelector('.view-deep');
    if (!root) return;
    const sync = () => {
      root.querySelectorAll(SENSOR_SELECTORS.join(', ')).forEach((el) => {
        const hasDirectTable = Array.from(el.children).some(
          (child) => child.tagName === 'TABLE',
        );
        el.toggleAttribute('data-has-table', hasDirectTable);
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
