'use client';

import type { ShopProduct } from '@/lib/shop/products';
import type { CartLine } from '@/lib/cart/types';
import {
  clearRemoteCart,
  getRemoteCartLines,
  mergeCartOnLogin,
  syncRemoteCart,
} from '@/app/actions/cart-sync';
import {
  CART_STORAGE_KEY,
  parseCartStorage,
  serializeCartStorage,
} from '@/lib/shop/commerce-storage';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@enjambre/auth';
import { useMetaTracking } from '@/lib/tracking/client';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type { CartLine } from '@/lib/cart/types';

export type CartNotificationItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  photo?: string | null;
  format?: string | null;
};

export { CART_STORAGE_KEY };
const REMOTE_SYNC_DEBOUNCE_MS = 500;
const REALTIME_RELOAD_DEBOUNCE_MS = 300;

type CartLinesApi = {
  lines: CartLine[];
  hydrated: boolean;
  add: (
    product: Pick<ShopProduct, 'id' | 'slug' | 'name' | 'price'> & {
      photos?: string[];
      format?: string | null;
      formatLabel?: string | null;
      imageUrl?: string | null;
    },
    qty?: number,
    options?: { silent?: boolean },
  ) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  itemCount: number;
  subtotal: number;
  lastNotification: CartNotificationItem | null;
  isCartModalOpen: boolean;
  openCartModal: (item?: CartNotificationItem) => void;
  closeCartModal: () => void;
};

const CartLinesContext = createContext<CartLinesApi | null>(null);

type LoadedCart = { lines: CartLine[]; updatedAt: number };

function loadCartState(): LoadedCart {
  if (typeof window === 'undefined') return { lines: [], updatedAt: 0 };
  try {
    return parseCartStorage<CartLine>(localStorage.getItem(CART_STORAGE_KEY));
  } catch (error) {
    console.error('[cart] localStorage parse error:', error);
    return { lines: [], updatedAt: 0 };
  }
}

function persistLines(lines: CartLine[], updatedAt: number) {
  localStorage.setItem(CART_STORAGE_KEY, serializeCartStorage(lines, updatedAt));
}

function toQuantityItems(lines: CartLine[]) {
  return lines.map((line) => ({
    product_id: line.productId,
    quantity: line.quantity,
  }));
}

export function CartLinesProvider({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const track = useMetaTracking();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const mergedUserRef = useRef<string | null>(null);
  const applyingRemoteRef = useRef(false);
  const loadedCartRef = useRef<LoadedCart>({ lines: [], updatedAt: 0 });
  const linesRef = useRef<CartLine[]>([]);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    const stored = loadCartState();
    loadedCartRef.current = stored;
    setLines(stored.lines);
    setHydrated(true);

    const missingImageIds = stored.lines.filter((l) => !l.imageUrl).map((l) => l.productId);
    if (missingImageIds.length > 0) {
      const supabase = createClient();
      void supabase
        .from('productos')
        .select('id, fotos')
        .in('id', missingImageIds)
        .then(({ data }: { data: Array<{ id: string; fotos: unknown }> | null }) => {
          if (!data || data.length === 0) return;
          const photoMap = new Map<string, string>();
          for (const item of data) {
            const rawFotos = item.fotos as unknown;
            let firstPhoto: string | null = null;
            if (Array.isArray(rawFotos) && rawFotos.length > 0 && typeof rawFotos[0] === 'string') {
              firstPhoto = rawFotos[0];
            } else if (typeof rawFotos === 'string') {
              try {
                const parsed = JSON.parse(rawFotos) as unknown;
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                  firstPhoto = parsed[0];
                }
              } catch {
                if (rawFotos.startsWith('http')) firstPhoto = rawFotos;
              }
            }
            if (firstPhoto) photoMap.set(item.id, firstPhoto);
          }
          if (photoMap.size > 0) {
            setLines((prev) =>
              prev.map((l) =>
                !l.imageUrl && photoMap.has(l.productId)
                  ? { ...l, imageUrl: photoMap.get(l.productId)! }
                  : l,
              ),
            );
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // El timestamp solo avanza con mutaciones del usuario: hidratar o aplicar el
    // carrito remoto no debe "fresquear" un carrito viejo (rompería la
    // detección de carrito pagado en otro dispositivo).
    persistLines(lines, loadedCartRef.current.updatedAt);
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

    void mergeCartOnLogin(
      toQuantityItems(linesRef.current),
      loadedCartRef.current.updatedAt,
    )
      .then(({ lines: merged }) => {
        if (cancelled) return;
        mergedUserRef.current = userId;
        setLines(merged);
        setRemoteReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[cart] merge on login failed — usando carrito local');
        }
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
      void syncRemoteCart(toQuantityItems(lines)).catch(() => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[cart] remote sync failed — reintentará en el próximo cambio');
        }
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

  const [lastNotification, setLastNotification] = useState<CartNotificationItem | null>(null);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, []);

  const closeCartModal = useCallback(() => {
    setIsCartModalOpen(false);
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, []);

  const openCartModal = useCallback((item?: CartNotificationItem) => {
    if (item) {
      setLastNotification(item);
    }
    setIsCartModalOpen(true);
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => {
      setIsCartModalOpen(false);
    }, 5000);
  }, []);

  const markCartMutation = useCallback(() => {
    loadedCartRef.current = { ...loadedCartRef.current, updatedAt: Date.now() };
  }, []);

  const add = useCallback(
    (
      product: Pick<ShopProduct, 'id' | 'slug' | 'name' | 'price'> & {
        photos?: string[];
        format?: string | null;
        formatLabel?: string | null;
        imageUrl?: string | null;
      },
      qty = 1,
      options?: { silent?: boolean },
    ) => {
      const clampedQty = Math.min(qty, 99);
      const photo = product.imageUrl ?? product.photos?.[0] ?? null;
      // AddToCart (Meta): chokepoint único — cubre PDP, landing y catálogo.
      // El facade gatea por consentimiento; no bloquea el carrito nunca.
      track({
        eventName: 'AddToCart',
        value: Math.round(product.price * clampedQty),
        currency: 'CLP',
        contentIds: [product.id],
        contents: [{ id: product.id, quantity: clampedQty, itemPrice: product.price }],
        contentName: product.name,
        numItems: clampedQty,
      });

      markCartMutation();
      setLines((prev) => {
        const i = prev.findIndex((l) => l.productId === product.id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = {
            ...next[i]!,
            quantity: Math.min(next[i]!.quantity + clampedQty, 99),
            imageUrl: next[i]!.imageUrl || photo || null,
          };
          return next;
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            unitPrice: product.price,
            quantity: clampedQty,
            imageUrl: photo || null,
          },
        ];
      });

      if (!options?.silent) {
        const notif: CartNotificationItem = {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          quantity: clampedQty,
          photo: photo,
          format: product.formatLabel ?? product.format ?? null,
        };
        setLastNotification(notif);
        setIsCartModalOpen(true);
        if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = setTimeout(() => {
          setIsCartModalOpen(false);
        }, 5000);
      }
    },
    [track, markCartMutation],
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      markCartMutation();
      if (qty < 1) {
        setLines((prev) => prev.filter((l) => l.productId !== productId));
        return;
      }
      setLines((prev) =>
        prev.map((l) =>
          l.productId === productId ? { ...l, quantity: Math.min(qty, 99) } : l,
        ),
      );
    },
    [markCartMutation],
  );

  const remove = useCallback(
    (productId: string) => {
      markCartMutation();
      setLines((prev) => prev.filter((l) => l.productId !== productId));
    },
    [markCartMutation],
  );

  const clear = useCallback(() => {
    markCartMutation();
    setLines([]);
    void clearRemoteCart().catch((error: unknown) => {
      console.error('[cart] remote clear failed:', error);
    });
  }, [markCartMutation]);

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
      lastNotification,
      isCartModalOpen,
      openCartModal,
      closeCartModal,
    }),
    [
      lines,
      hydrated,
      add,
      setQty,
      remove,
      clear,
      itemCount,
      subtotal,
      lastNotification,
      isCartModalOpen,
      openCartModal,
      closeCartModal,
    ],
  );

  return <CartLinesContext.Provider value={value}>{children}</CartLinesContext.Provider>;
}

export function useCartLines() {
  const ctx = useContext(CartLinesContext);
  if (!ctx) throw new Error('useCartLines debe usarse dentro de CartLinesProvider');
  return ctx;
}