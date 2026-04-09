'use client';

import type { ShopProduct } from '@/lib/shop/products';
import { useCart } from '@/components/shop/cart-context';
import React, { useState } from 'react';

export function AddToCartButton({ product }: { product: ShopProduct }) {
  const cart = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      className="px-6 py-3 rounded-full bg-[#0A3D2F] text-white font-medium hover:bg-[#082a21] transition-colors"
      onClick={() => {
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
        window.setTimeout(() => setAdded(false), 1200);
      }}
    >
      {added ? 'Agregado' : 'Agregar al carrito'}
    </button>
  );
}

