'use client';

import type { ShopProduct } from '@/lib/shop/products';
import {
  clearRemoteCart,
  getRemoteCartLines,
  mergeCartOnLogin,
  syncRemoteCart,
} from '@/app/actions/cart-sync';
import { CART_STORAGE_KEY } from '@/lib/shop/commerce-storage';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@enjambre/auth';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export { CART_STORAGE_KEY };
const REMOTE_SYNC_DEBOUNCE_MS = 500;
const REALTIME_RELOAD_DEBOUNCE_MS = 300;

type CartLinesApi = {
  lines: CartLine[];
  hydrated: boolean;
  add: (product: Pick<ShopProduct, 'id' | 'slug' | 'name' | 'price'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  itemCount: number;
  subtotal: number;
};

const CartLinesContext = createContext<CartLinesApi | null>(null);

function loadLines(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[cart] localStorage parse error:', error);
    return [];
  }
}

function persistLines(lines: CartLine[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
}

function toQuantityItems(lines: CartLine[]) {
  return lines.map((line) => ({
    product_id: line.productId,
    quantity: line.quantity,
  }));
}

export function CartLinesProvider({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const mergedUserRef = useRef<string | null>(null);
  const applyingRemoteRef = useRef(false);

  useEffect(() => {
    setLines(loadLines());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistLines(lines);
  }, [lines, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    if (!userId) {
      mergedUserRef.current = null;
      setRemoteReady(true);
      return;
    }

    if (mergedUserRef.current === userId) {
      setRemoteReady(true);
      return;
    }

    let cancelled = false;
    setRemoteReady(false);

    void mergeCartOnLogin(toQuantityItems(loadLines()))
      .then((merged) => {
        if (cancelled) return;
        mergedUserRef.current = userId;
        setLines(merged);
        setRemoteReady(true);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('[cart] merge on login failed:', error);
        mergedUserRef.current = userId;
        setRemoteReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, userId]);

  useEffect(() => {
    if (!hydrated || !userId || !remoteReady) return;

    const timer = setTimeout(() => {
      if (applyingRemoteRef.current) return;
      void syncRemoteCart(toQuantityItems(lines)).catch((error: unknown) => {
        console.error('[cart] remote sync failed:', error);
      });
    }, REMOTE_SYNC_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [lines, hydrated, userId, remoteReady]);

  useEffect(() => {
    if (!hydrated || !userId || !remoteReady) return;

    const supabase = createClient();
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;

    const reloadFromRemote = () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        void getRemoteCartLines()
          .then((remoteLines) => {
            applyingRemoteRef.current = true;
            setLines(remoteLines);
            window.setTimeout(() => {
              applyingRemoteRef.current = false;
            }, REMOTE_SYNC_DEBOUNCE_MS + 100);
          })
          .catch((error: unknown) => {
            console.error('[cart] realtime reload failed:', error);
          });
      }, REALTIME_RELOAD_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`carrito-items-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carrito_items',
          filter: `user_id=eq.${userId}`,
        },
        reloadFromRemote,
      )
      .subscribe((status: string, err?: Error) => {
        if (err || status === 'CHANNEL_ERROR') {
          console.error('[cart] realtime subscription error', err);
        }
      });

    return () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      void supabase.removeChannel(channel);
    };
  }, [hydrated, userId, remoteReady]);

  const add = useCallback(
    (product: Pick<ShopProduct, 'id' | 'slug' | 'name' | 'price'>, qty = 1) => {
      setLines((prev) => {
        const i = prev.findIndex((l) => l.productId === product.id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i]!, quantity: Math.min(next[i]!.quantity + qty, 99) };
          return next;
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            unitPrice: product.price,
            quantity: Math.min(qty, 99),
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
      prev.map((l) =>
        l.productId === productId ? { ...l, quantity: Math.min(qty, 99) } : l,
      ),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    void clearRemoteCart().catch((error: unknown) => {
      console.error('[cart] remote clear failed:', error);
    });
  }, []);

  const itemCount = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines],
  );

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [lines],
  );

  const value = useMemo<CartLinesApi>(
    () => ({
      lines,
      hydrated,
      add,
      setQty,
      remove,
      clear,
      itemCount,
      subtotal,
    }),
    [lines, hydrated, add, setQty, remove, clear, itemCount, subtotal],
  );

  return <CartLinesContext.Provider value={value}>{children}</CartLinesContext.Provider>;
}

export function useCartLines() {
  const ctx = useContext(CartLinesContext);
  if (!ctx) throw new Error('useCartLines debe usarse dentro de CartLinesProvider');
  return ctx;
}