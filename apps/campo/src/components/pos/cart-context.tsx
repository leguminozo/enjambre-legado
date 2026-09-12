'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@enjambre/auth';
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

const BASE_STORAGE_KEY = 'enjambre-campo-pos-cart';
const BASE_DISCOUNT_KEY = 'enjambre-campo-pos-discount';

function getCartStorageKey(userId?: string | null) {
  return userId ? `${BASE_STORAGE_KEY}-${userId}` : BASE_STORAGE_KEY;
}

function getDiscountStorageKey(userId?: string | null) {
  return userId ? `${BASE_DISCOUNT_KEY}-${userId}` : BASE_DISCOUNT_KEY;
}

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
  const userId = useAuthStore((s) => s.user?.id);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [discount, setDiscountState] = useState<PosDiscount>({ kind: 'none' });
  const [ready, setReady] = useState(false);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect logout: when userId transitions from a logged-in user to null/undefined
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current && !userId) {
      setLines([]);
      setDiscountState({ kind: 'none' });
      try {
        localStorage.removeItem(BASE_STORAGE_KEY);
        localStorage.removeItem(BASE_DISCOUNT_KEY);
      } catch {
        // ignore storage error
      }
      prevUserIdRef.current = userId;
      setReady(true);
      return;
    }

    prevUserIdRef.current = userId;

    const storageKey = getCartStorageKey(userId);
    const discountKey = getDiscountStorageKey(userId);

    try {
      let loadedLines: CartLine[] = [];
      let loadedDiscount: PosDiscount = { kind: 'none' };

      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) loadedLines = parsed;
      } else if (userId) {
        // One-time migration from legacy unnamespaced key
        const legacyRaw = localStorage.getItem(BASE_STORAGE_KEY);
        if (legacyRaw) {
          const parsed = JSON.parse(legacyRaw) as CartLine[];
          if (Array.isArray(parsed)) loadedLines = parsed;
          localStorage.removeItem(BASE_STORAGE_KEY);
        }
      }

      const rawDisc = localStorage.getItem(discountKey);
      if (rawDisc) {
        const d = JSON.parse(rawDisc) as PosDiscount;
        if (d && typeof d === 'object' && 'kind' in d) loadedDiscount = d;
      } else if (userId) {
        const legacyDisc = localStorage.getItem(BASE_DISCOUNT_KEY);
        if (legacyDisc) {
          const d = JSON.parse(legacyDisc) as PosDiscount;
          if (d && typeof d === 'object' && 'kind' in d) loadedDiscount = d;
          localStorage.removeItem(BASE_DISCOUNT_KEY);
        }
      }

      setLines(loadedLines);
      setDiscountState(loadedDiscount);
    } catch (error) {
      console.error('[cart] localStorage parse error:', error);
      setLines([]);
      setDiscountState({ kind: 'none' });
    }
    setReady(true);
  }, [userId]);

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;
    const storageKey = getCartStorageKey(userId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      // ignore storage error
    }
  }, [lines, ready, userId]);

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;
    const discountKey = getDiscountStorageKey(userId);
    try {
      localStorage.setItem(discountKey, JSON.stringify(discount));
    } catch {
      // ignore storage error
    }
  }, [discount, ready, userId]);

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
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(getCartStorageKey(userId));
        localStorage.removeItem(getDiscountStorageKey(userId));
      } catch {
        // ignore storage error
      }
    }
  }, [userId]);

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

