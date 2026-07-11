'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartLine } from './types';
import {
  addCartLine,
  addQrToLine,
  cartTotal,
  removeCartLine,
  removeQrFromLine,
  setCartQty,
} from './cart-math';

const STORAGE_KEY = 'enjambre-campo-pos-cart';

type CartContextValue = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, 'cantidad'> & { cantidad?: number }) => void;
  setQty: (producto_id: string, cantidad: number) => void;
  removeLine: (producto_id: string) => void;
  addQrCode: (producto_id: string, code: string) => void;
  removeQrCode: (producto_id: string, code: string) => void;
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
    } catch (error) {
      console.error('[cart] localStorage parse error:', error);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const addLine = useCallback((line: Omit<CartLine, 'cantidad'> & { cantidad?: number }) => {
    setLines((prev) => addCartLine(prev, line));
  }, []);

  const setQty = useCallback((producto_id: string, cantidad: number) => {
    setLines((prev) => setCartQty(prev, producto_id, cantidad));
  }, []);

  const removeLine = useCallback((producto_id: string) => {
    setLines((prev) => removeCartLine(prev, producto_id));
  }, []);

  const addQrCode = useCallback((producto_id: string, code: string) => {
    setLines((prev) => addQrToLine(prev, producto_id, code));
  }, []);

  const removeQrCode = useCallback((producto_id: string, code: string) => {
    setLines((prev) => removeQrFromLine(prev, producto_id, code));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const total = useMemo(() => cartTotal(lines), [lines]);

  const value = useMemo(
    () => ({
      lines,
      addLine,
      setQty,
      removeLine,
      addQrCode,
      removeQrCode,
      clear,
      total,
      ready,
    }),
    [lines, addLine, setQty, removeLine, addQrCode, removeQrCode, clear, total, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart dentro de CartProvider');
  return ctx;
}
