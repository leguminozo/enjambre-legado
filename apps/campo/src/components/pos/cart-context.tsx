'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartLine } from './types';

const STORAGE_KEY = 'enjambre-campo-pos-cart';

type CartContextValue = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, 'cantidad'> & { cantidad?: number }) => void;
  setQty: (producto_id: string, cantidad: number) => void;
  removeLine: (producto_id: string) => void;
  clear: () => void;
  /** Suma en la misma unidad que `precio` en BD (p. ej. CLP). */
  total: number;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const addLine = useCallback((line: Omit<CartLine, 'cantidad'> & { cantidad?: number }) => {
    setLines((prev) => {
      const qty = Math.max(1, line.cantidad ?? 1);
      const i = prev.findIndex((p) => p.producto_id === line.producto_id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], cantidad: next[i].cantidad + qty };
        return next;
      }
      return [...prev, { ...line, cantidad: qty }];
    });
  }, []);

  const setQty = useCallback((producto_id: string, cantidad: number) => {
    const q = Math.max(0, Math.floor(cantidad));
    setLines((prev) => {
      if (q === 0) return prev.filter((p) => p.producto_id !== producto_id);
      return prev.map((p) => (p.producto_id === producto_id ? { ...p, cantidad: q } : p));
    });
  }, []);

  const removeLine = useCallback((producto_id: string) => {
    setLines((prev) => prev.filter((p) => p.producto_id !== producto_id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const total = useMemo(
    () => lines.reduce((s, l) => s + l.precio_unitario * l.cantidad, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      addLine,
      setQty,
      removeLine,
      clear,
      total,
      ready,
    }),
    [lines, addLine, setQty, removeLine, clear, total, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart dentro de CartProvider');
  return ctx;
}
