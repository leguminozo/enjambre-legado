'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Mide el ancho de un elemento con ResizeObserver + throttle rAF.
 * Es el reemplazo de container queries (Safari 16+; el piso soportado es iOS 15.4):
 * los tools miden SU área real (no el viewport) para adaptarse.
 * El setState ocurre como máximo una vez por frame y solo si el ancho cambió —
 * misma filosofía de bajo coste que useShellLayout en hardware legacy (iPhone 7).
 * El nodo se guarda en estado: si el elemento se remonta (p. ej. tabla en modo
 * fullscreen), el observer se re-suscribe y la medición continúa.
 */
export function useElementWidth<T extends HTMLElement = HTMLElement>(): {
  ref: (el: T | null) => void;
  width: number;
} {
  const [width, setWidth] = useState(0);
  const [node, setNode] = useState<T | null>(null);
  const rafRef = useRef<number>(0);

  const ref = useCallback((el: T | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) return;
    let pending = false;
    const update = () => {
      const next = node.clientWidth;
      setWidth((prev) => (prev === next ? prev : next));
    };
    const onResize = () => {
      if (pending) return;
      pending = true;
      rafRef.current = requestAnimationFrame(() => {
        pending = false;
        update();
      });
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(node);
    update();
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [node]);

  return { ref, width };
}
