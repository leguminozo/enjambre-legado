'use client';

import type { ShopProduct } from '@/lib/shop/products';
import { useCart } from '@/components/shop/cart-context';
import React, { useState } from 'react';

export function AddToCartButton({
  product,
  disabled = false,
}: {
  product: ShopProduct;
  disabled?: boolean;
}) {
  const cart = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-45"
      onClick={() => {
        if (disabled) return;
        cart.add(
          {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
          },
          1,
        );
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
    >
      {added ? 'Agregado al carrito' : 'Agregar al carrito'}
    </button>
  );
}
