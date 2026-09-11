'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartLine } from './types';
import {
  addCartLine,
  addQrToLine,
  cartTotal,
  computePosTotals,
  type PosDiscount,
  type PosTotals,
  type ProductScanInput,
  removeCartLine,
  removeQrFromLine,
  scanAndAddProductToCart,
  setCartQty,
} from './cart-math';

const STORAGE_KEY = 'enjambre-campo-pos-cart';
const DISCOUNT_KEY = 'enjambre-campo-pos-discount';

type CartContextValue = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, 'cantidad'> & { cantidad?: number }) => void;
  scanAndAdd: (product: ProductScanInput, qrCode?: string) => void;
  setQty: (producto_id: string, cantidad: number) => void;
  removeLine: (producto_id: string) => void;
  addQrCode: (producto_id: string, code: string) => void;
  removeQrCode: (producto_id: string, code: string) => void;
  clear: () => void;
  discount: PosDiscount;
  setDiscount: (d: PosDiscount) => void;
  /** Subtotal sin descuento. */
  subtotal: number;
  /** Total a cobrar (con descuento). */
  total: number;
  totals: PosTotals;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [discount, setDiscountState] = useState<PosDiscount>({ kind: 'none' });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) setLines(parsed);
      }
      const rawDisc = typeof window !== 'undefined' ? localStorage.getItem(DISCOUNT_KEY) : null;
      if (rawDisc) {
        const d = JSON.parse(rawDisc) as PosDiscount;
        if (d && typeof d === 'object' && 'kind' in d) setDiscountState(d);
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

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;
    localStorage.setItem(DISCOUNT_KEY, JSON.stringify(discount));
  }, [discount, ready]);

  const addLine = useCallback((line: Omit<CartLine, 'cantidad'> & { cantidad?: number }) => {
    setLines((prev) => addCartLine(prev, line));
  }, []);

  const scanAndAdd = useCallback((product: ProductScanInput, qrCode?: string) => {
    setLines((prev) => scanAndAddProductToCart(prev, product, qrCode));
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

  const setDiscount = useCallback((d: PosDiscount) => {
    setDiscountState(d);
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setDiscountState({ kind: 'none' });
  }, []);

  const subtotal = useMemo(() => cartTotal(lines), [lines]);
  const totals = useMemo(() => computePosTotals(subtotal, discount), [subtotal, discount]);
  const total = totals.total;

  const value = useMemo(
    () => ({
      lines,
      addLine,
      scanAndAdd,
      setQty,
      removeLine,
      addQrCode,
      removeQrCode,
      clear,
      discount,
      setDiscount,
      subtotal,
      total,
      totals,
      ready,
    }),
    [
      lines,
      addLine,
      scanAndAdd,
      setQty,
      removeLine,
      addQrCode,
      removeQrCode,
      clear,
      discount,
      setDiscount,
      subtotal,
      total,
      totals,
      ready,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart dentro de CartProvider');
  return ctx;
}

export function useOptionalCart(): CartContextValue | null {
  return useContext(CartContext);
}

