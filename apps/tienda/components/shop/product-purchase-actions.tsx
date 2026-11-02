'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Repeat, Minus, Plus } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { createClient } from '@/utils/supabase/client';
import type { ShopProduct } from '@/lib/shop/products';
import type { ReplenishmentPlan } from '@/lib/shop/replenishment';
import { AddToCartButton, BuyNowButton } from '@/app/producto/[slug]/ui';
import { ReplenishmentSheet } from '@/components/shop/replenishment-sheet';

type ProductPurchaseActionsProps = {
  product: ShopProduct;
  plans?: ReplenishmentPlan[];
  inStock: boolean;
  /** Oculta el botón primario (p.ej. en móvil cuando hay sticky CTA) */
  hidePrimaryAdd?: boolean;
};

export function ProductPurchaseActions({
  product,
  inStock,
  hidePrimaryAdd = false,
}: ProductPurchaseActionsProps) {
  const t = useTranslations('product');
  const router = useRouter();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const maxAvailable = product.stock != null && product.stock > 0 ? Math.min(product.stock, 24) : 24;
  const canReplenish = inStock;

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () => setQuantity((q) => Math.min(maxAvailable, q + 1));

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
      <div className="mt-6 flex flex-col gap-3.5 sm:mt-8">
        {/* Indicador refinado de disponibilidad y exclusividad de lote */}
        <div className="flex items-center gap-2">
          {product.stock != null && product.stock === 1 ? (
            <div className="inline-flex items-center gap-2 text-xs font-medium text-accent">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span>Última unidad disponible de esta recolección</span>
            </div>
          ) : product.stock != null && product.stock > 1 && product.stock <= 5 ? (
            <div className="inline-flex items-center gap-2 text-xs font-medium text-foreground/90">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span>Reserva limitada · Solo {product.stock} unidades disponibles</span>
            </div>
          ) : product.stock != null && product.stock > 5 ? (
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
              <span>Disponible en bodega de origen</span>
            </div>
          ) : !inStock ? (
            <div className="inline-flex items-center gap-2 text-xs text-destructive">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              <span>Recolección estacional agotada</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
              <span>Edición limitada de bosque nativo</span>
            </div>
          )}
        </div>

        {/* Fila de compra: selector [- 1 +] y botones principales */}
        <div className="flex flex-wrap items-center gap-3">
          {!hidePrimaryAdd && inStock ? (
            <div className="flex items-center rounded-full border border-border/80 bg-card/60 p-1">
              <button
                type="button"
                aria-label="Disminuir cantidad"
                onClick={decrement}
                disabled={quantity <= 1 || !inStock}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 hover:bg-surface-raised hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="w-8 text-center font-mono text-sm font-semibold tabular-nums text-foreground">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Aumentar cantidad"
                onClick={increment}
                disabled={quantity >= maxAvailable || !inStock}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 hover:bg-surface-raised hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {!hidePrimaryAdd ? (
            <>
              <BuyNowButton product={product} quantity={quantity} disabled={!inStock} />
              <AddToCartButton product={product} quantity={quantity} disabled={!inStock} />
            </>
          ) : null}
        </div>

        {canReplenish ? (
          <div className="pt-1">
            <button
              type="button"
              data-testid="schedule-replenishment"
              disabled={checkingAuth}
              onClick={() => void handleReplenishClick()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-border/80 bg-surface-sunken/40 px-6 py-2.5 text-xs font-medium text-foreground/85 transition hover:border-accent/50 hover:text-accent disabled:opacity-60 cursor-pointer"
            >
              <Repeat className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
              {checkingAuth ? 'Comprobando...' : t('scheduleReplenishment')}
            </button>
          </div>
        ) : null}
      </div>

      <ReplenishmentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        product={product}
      />
    </>
  );
}