'use client';

import React from 'react';
import { CartLinesProvider, useCartLines } from './cart-lines-context';
import { CartPricingProvider, useCartPricing } from './cart-pricing-context';

export type { CartLine } from './cart-lines-context';
export { useCartLines, useCartPricing };

export function CartProvider({ children }: { children: React.ReactNode }) {
  return (
    <CartLinesProvider>
      <CartPricingProvider>{children}</CartPricingProvider>
    </CartLinesProvider>
  );
}

/** Combina líneas + pricing. Activa el cálculo server-side (usar solo en checkout). */
export function useCart() {
  const lines = useCartLines();
  const pricing = useCartPricing();
  return { ...lines, ...pricing };
}