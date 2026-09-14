'use client';

import { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import type { ShopProduct } from '@/lib/shop/products';
import { useCartLines } from '@/components/shop/cart-context';

type Props = {
  product: Pick<ShopProduct, 'id' | 'slug' | 'name' | 'price'>;
  disabled?: boolean;
  label?: string;
  addedLabel?: string;
};

export function QuickAddButton({
  product,
  disabled = false,
  label = 'Agregar',
  addedLabel = 'Agregado',
}: Props) {
  const { add } = useCartLines();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (disabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }
    add(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <button
      type="button"
      data-testid="add-to-cart"
      disabled={disabled}
      onClick={handleAdd}
      aria-label={added ? `${addedLabel}: ${product.name}` : `${label}: ${product.name}`}
      className={`mt-auto pt-3 w-full min-h-[44px] py-2.5 px-2 border text-[0.68rem] sm:text-xs uppercase tracking-wider sm:tracking-widest rounded-md flex items-center justify-center gap-1.5 font-medium transition-all duration-300 active:scale-[0.97] disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 ${
        added
          ? 'bg-accent text-accent-foreground border-accent shadow-sm'
          : 'border-accent text-accent-text hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      {added ? (
        <>
          <Check size={14} className="stroke-[2.5]" aria-hidden />
          <span>{addedLabel}</span>
        </>
      ) : (
        <>
          <ShoppingBag size={13} aria-hidden />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
