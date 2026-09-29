'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Repeat } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { createClient } from '@/utils/supabase/client';
import type { ShopProduct } from '@/lib/shop/products';
import type { ReplenishmentPlan } from '@/lib/shop/replenishment';
import { AddToCartButton } from '@/app/producto/[slug]/ui';
import { ReplenishmentSheet } from '@/components/shop/replenishment-sheet';

type ProductPurchaseActionsProps = {
  product: ShopProduct;
  plans: ReplenishmentPlan[];
  inStock: boolean;
  /** Oculta el botón primario (p.ej. en móvil cuando hay sticky CTA) */
  hidePrimaryAdd?: boolean;
};

export function ProductPurchaseActions({
  product,
  plans,
  inStock,
  hidePrimaryAdd = false,
}: ProductPurchaseActionsProps) {
  const t = useTranslations('product');
  const router = useRouter();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const canReplenish = inStock && plans.length > 0;

  const handleReplenishClick = async () => {
    setCheckingAuth(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast('Inicia sesión o regístrate en el Club Legado para activar reposiciones periódicas y telemetría de colmena.', {
          type: 'info',
        });
        const nextUrl = pathname || `/producto/${product.slug}`;
        router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
        return;
      }

      setSheetOpen(true);
    } catch {
      setSheetOpen(true);
    } finally {
      setCheckingAuth(false);
    }
  };

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
        {!hidePrimaryAdd ? <AddToCartButton product={product} disabled={!inStock} /> : null}
        {canReplenish ? (
          <button
            type="button"
            data-testid="schedule-replenishment"
            disabled={checkingAuth}
            onClick={() => void handleReplenishClick()}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-border px-8 py-3.5 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent disabled:opacity-60 cursor-pointer"
          >
            <Repeat size={16} strokeWidth={2} />
            {checkingAuth ? 'Comprobando...' : t('scheduleReplenishment')}
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