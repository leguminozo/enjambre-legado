'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus } from 'lucide-react';
import type { ShopProduct } from '@/lib/shop/products';
import { useCartLines } from '@/components/shop/cart-context';

type Props = {
  product: Pick<ShopProduct, 'id' | 'slug' | 'name' | 'price'> & {
    photos?: string[];
    format?: string | null;
    formatLabel?: string | null;
    stock?: number | null;
    imageUrl?: string | null;
  };
  disabled?: boolean;
  label?: string;
  addedLabel?: string;
  /** false por defecto para permitir al cliente seguir explorando el catálogo */
  goToCart?: boolean;
};

export function QuickAddButton({
  product,
  disabled = false,
  goToCart = false,
}: Props) {
  const { lines, add, setQty, changeQty, remove } = useCartLines();
  const router = useRouter();

  const isOutOfStock = disabled || (product.stock != null && product.stock <= 0);
  const cartLine = lines.find((l) => l.productId === product.id);
  const currentQty = cartLine?.quantity ?? 0;
  const maxAvailable = product.stock != null && product.stock > 0 ? Math.min(product.stock, 99) : 99;

  const handleIncrement = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isOutOfStock) return;
    if (currentQty >= maxAvailable) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }

    if (currentQty === 0) {
      add(product, 1);
    } else {
      changeQty(product.id, 1);
    }

    if (goToCart) {
      window.setTimeout(() => {
        router.push('/carrito');
      }, 700);
    }
  };

  const handleDecrement = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentQty <= 0) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }

    if (currentQty === 1) {
      remove(product.id);
    } else {
      changeQty(product.id, -1);
    }
  };

  if (isOutOfStock) {
    return (
      <div
        className="mt-auto pt-2 w-full min-h-[44px] rounded-full border border-border/60 bg-surface-sunken/40 px-3 py-2 flex items-center justify-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 select-none cursor-not-allowed"
        aria-disabled="true"
        title="Recolección estacional agotada"
      >
        Agotado
      </div>
    );
  }

  const hasItems = currentQty > 0;

  return (
    <div
      role="group"
      aria-label={`Selector de cantidad para ${product.name}`}
      className={`mt-auto pt-2 w-full flex items-center justify-between rounded-full border min-h-[44px] px-1 py-0.5 transition-all duration-300 ${
        hasItems
          ? 'border-accent/70 bg-card/90 shadow-sm'
          : 'border-border/80 bg-card/50 hover:border-accent/40'
      }`}
    >
      <button
        type="button"
        disabled={currentQty <= 0}
        onClick={handleDecrement}
        aria-label={`Disminuir cantidad de ${product.name}`}
        className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-foreground/80 hover:bg-surface-raised hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground/80 transition-colors active:scale-90 cursor-pointer"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => {
          if (currentQty === 0) handleIncrement();
        }}
        aria-label={
          currentQty === 0
            ? `Agregar ${product.name} al carrito`
            : `${currentQty} unidades de ${product.name} en el carrito`
        }
        className={`flex-1 text-center font-mono text-sm sm:text-base font-semibold tabular-nums select-none transition-colors ${
          currentQty === 0
            ? 'text-muted-foreground/80 hover:text-foreground cursor-pointer'
            : 'text-accent-text font-bold cursor-default'
        }`}
      >
        {currentQty}
      </button>

      <button
        type="button"
        data-testid="add-to-cart"
        disabled={currentQty >= maxAvailable}
        onClick={handleIncrement}
        aria-label={`Aumentar cantidad de ${product.name}`}
        className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-foreground/80 hover:bg-surface-raised hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground/80 transition-colors active:scale-90 cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
