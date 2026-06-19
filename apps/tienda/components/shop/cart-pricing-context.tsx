'use client';

import { calculateCartPricing, type CartPricing } from '@/app/actions/cart';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useCartLines } from './cart-lines-context';

const PRICING_DEBOUNCE_MS = 300;

type CartPricingApi = {
  pricing?: CartPricing;
  isLoading: boolean;
  pricingError: string | null;
};

const CartPricingContext = createContext<CartPricingApi | null>(null);
const CartPricingSubscriptionContext = createContext<((active: boolean) => void) | null>(null);

export function CartPricingProvider({ children }: { children: React.ReactNode }) {
  const { lines, hydrated } = useCartLines();
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [pricing, setPricing] = useState<CartPricing | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  const setPricingActive = useCallback((active: boolean) => {
    setSubscriberCount((count) => Math.max(0, active ? count + 1 : count - 1));
  }, []);

  const pricingEnabled = subscriberCount > 0;

  useEffect(() => {
    if (!hydrated || !pricingEnabled) {
      if (!pricingEnabled) {
        setIsLoading(false);
      }
      return;
    }

    if (lines.length === 0) {
      setPricing(undefined);
      setIsLoading(false);
      setPricingError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const timer = setTimeout(() => {
      void calculateCartPricing(
        lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
      )
        .then((result) => {
          if (cancelled) return;
          setPricing(result.line_items.length > 0 ? result : undefined);
          setPricingError(
            result.line_items.length > 0 ? null : 'Algunos productos ya no están disponibles',
          );
          setIsLoading(false);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          console.error('[cart] pricing error:', error);
          setPricing(undefined);
          setPricingError('No se pudieron calcular los precios');
          setIsLoading(false);
        });
    }, PRICING_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [lines, hydrated, pricingEnabled]);

  const pricingValue = useMemo<CartPricingApi>(
    () => ({ pricing, isLoading: pricingEnabled && isLoading, pricingError }),
    [pricing, isLoading, pricingError, pricingEnabled],
  );

  return (
    <CartPricingSubscriptionContext.Provider value={setPricingActive}>
      <CartPricingContext.Provider value={pricingValue}>{children}</CartPricingContext.Provider>
    </CartPricingSubscriptionContext.Provider>
  );
}

export function useCartPricing() {
  const ctx = useContext(CartPricingContext);
  const setActive = useContext(CartPricingSubscriptionContext);
  if (!ctx || !setActive) {
    throw new Error('useCartPricing debe usarse dentro de CartPricingProvider');
  }

  useEffect(() => {
    setActive(true);
    return () => setActive(false);
  }, [setActive]);

  return ctx;
}