'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Repeat } from 'lucide-react';
import type { ShopProduct } from '@/lib/shop/products';
import type { ReplenishmentPlan } from '@/lib/shop/replenishment';
import { AddToCartButton } from '@/app/producto/[slug]/ui';
import { ReplenishmentSheet } from '@/components/shop/replenishment-sheet';

type ProductPurchaseActionsProps = {
  product: ShopProduct;
  plans: ReplenishmentPlan[];
  inStock: boolean;
};

export function ProductPurchaseActions({ product, plans, inStock }: ProductPurchaseActionsProps) {
  const t = useTranslations('product');
  const [sheetOpen, setSheetOpen] = useState(false);
  const canReplenish = inStock && plans.length > 0;

  return (
    <>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <AddToCartButton product={product} disabled={!inStock} />
        {canReplenish ? (
          <button
            type="button"
            data-testid="schedule-replenishment"
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-3.5 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
          >
            <Repeat size={16} strokeWidth={2} />
            {t('scheduleReplenishment')}
          </button>
        ) : null}
        <span className="text-sm text-muted-foreground sm:w-full">
          {product.stock == null
            ? 'Stock por confirmar'
            : product.stock > 0
              ? `${product.stock} disponibles`
              : 'Sin stock'}
        </span>
      </div>

      <ReplenishmentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        product={product}
        plans={plans}
      />
    </>
  );
}