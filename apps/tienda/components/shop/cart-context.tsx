'use client';

import type { ShopProduct } from '@/lib/shop/products';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

type CartApi = {
  lines: CartLine[];
  add: (product: Pick<ShopProduct, 'id' | 'slug' | 'name' | 'price'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  itemCount: number;
  subtotal: number;
};

const STORAGE_KEY = 'oyz_tienda_cart_v1';

const CartContext = createContext<CartApi | null>(null);

function load(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(lines: CartLine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persist(lines);
  }, [lines, hydrated]);

  const add = useCallback(
    (product: Pick<ShopProduct, 'id' | 'slug' | 'name' | 'price'>, qty = 1) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === product.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i]!, quantity: next[i]!.quantity + qty };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          unitPrice: product.price,
          quantity: qty,
        },
      ];
    });
    },
    [],
  );

  const setQty = useCallback((productId: string, qty: number) => {
    if (qty < 1) {
      setLines((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const itemCount = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines],
  );
  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [lines],
  );

  const value = useMemo<CartApi>(
    () => ({
      lines,
      add,
      setQty,
      remove,
      clear,
      itemCount,
      subtotal,
    }),
    [lines, add, setQty, remove, clear, itemCount, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
