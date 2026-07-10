'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { formatCLP } from '@/lib/shop/format';
import type { ShopProduct } from '@/lib/shop/products';
import type { ReplenishmentPlan } from '@/lib/shop/replenishment';
import { ProductGallery } from '@/components/shop/product-gallery';
import { ProductPurchaseActions } from '@/components/shop/product-purchase-actions';
import { ResenasSection } from '@/components/shop/resenas-section';
import { TraceabilitySection, AddToCartButton } from '@/app/producto/[slug]/ui';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { resolveLocalized } from '@/lib/shop/store-chrome';

type Props = {
  product: ShopProduct;
  inStock: boolean;
  plans: ReplenishmentPlan[];
  resenasAggregate: { ratingValue: number; reviewCount: number } | null;
};

export function PdpBody({ product, inStock, plans, resenasAggregate }: Props) {
  const locale = useLocale();
  const { pdp } = useStoreChrome();
  const continueLabel = resolveLocalized(pdp.continue_label, pdp.continue_label_en, locale);

  return (
    <main className="bg-background pb-28 md:pb-16">
      {pdp.show_breadcrumb ? (
        <div className="border-b border-border px-4 py-3 sm:px-6 md:py-4">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <Link href="/catalogo" className="md:hidden hover:text-accent font-medium text-accent">
              ← Catálogo
            </Link>
            <span className="hidden md:contents">
              <Link href="/" className="hover:text-accent">
                Inicio
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              <Link href="/catalogo" className="hover:text-accent">
                Creaciones
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              <span className="font-medium text-foreground/70">{product.name}</span>
            </span>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-6xl gap-8 px-0 py-0 sm:gap-14 sm:px-6 sm:py-10 lg:grid-cols-[1fr_minmax(280px,400px)] lg:items-start lg:px-6 lg:py-14">
        <div className="px-0 sm:px-0">
          <ProductGallery photos={product.photos} alt={product.name} />
        </div>

        <div className="px-4 sm:px-0 lg:sticky lg:top-28">
          {pdp.show_format_badge && product.format ? (
            <span className="inline-block rounded bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              {product.format}
            </span>
          ) : null}
          <h1 className="mt-3 font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 font-display text-xl text-accent sm:text-2xl md:mt-4">
            {formatCLP(product.price)}
          </p>

          {product.description ? (
            <div className="mt-6 border-l-2 border-accent/60 pl-4 sm:mt-8 sm:pl-5">
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/70 sm:text-base">
                {product.description}
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm italic text-muted-foreground/60 sm:mt-8">
              Descripción disponible pronto.
            </p>
          )}

          {pdp.show_badges ? (
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
              {product.sustituye_azucar_g ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-3 py-1 text-[9px] uppercase tracking-wider text-accent/80">
                  Sustituye ~{product.sustituye_azucar_g}g azúcar
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-3 py-1 text-[9px] uppercase tracking-wider text-accent/80">
                  Sustituye azúcar refinada
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 px-3 py-1 text-[9px] uppercase tracking-wider text-success/80">
                Bosque nativo
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/20 px-3 py-1 text-[9px] uppercase tracking-wider text-muted-foreground/60">
                Miel viva
              </span>
              {product.irr_referencia && product.irr_referencia > 1 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 px-3 py-1 text-[9px] uppercase tracking-wider text-success/80">
                  IRR {product.irr_referencia}
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Desktop / tablet purchase actions */}
          <div className="hidden md:block">
            <ProductPurchaseActions
              product={product}
              plans={pdp.show_replenishment ? plans : []}
              inStock={inStock}
            />
          </div>

          {/* Mobile inline secondary actions */}
          <div className="mt-6 md:hidden">
            <ProductPurchaseActions
              product={product}
              plans={pdp.show_replenishment ? plans : []}
              inStock={inStock}
              hidePrimaryAdd
            />
          </div>

          {pdp.show_traceability ? (
            <TraceabilitySection
              slug={product.slug}
              blockchainHash={product.blockchain_hash}
              colmenaOrigen={product.colmena_origen}
              fechaCosecha={product.fecha_cosecha}
              fechaEnvasado={product.fecha_envasado}
              nombreLote={product.nombre_lote}
              descripcionLote={product.descripcion_lote}
            />
          ) : null}

          <Link
            href="/catalogo"
            className="mt-8 inline-flex text-sm font-medium text-accent hover:underline md:mt-10"
          >
            ← {continueLabel}
          </Link>
        </div>
      </div>

      {pdp.show_reviews ? (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-8">
          <ResenasSection
            productoId={product.id}
            productName={product.name}
            initialAggregate={resenasAggregate}
          />
        </div>
      ) : null}

      {/* Sticky thumb CTA — solo móvil */}
      <div className="tienda-sticky-cta md:hidden" data-testid="pdp-sticky-cta">
        <div className="tienda-sticky-cta-inner">
          <div className="min-w-0">
            <p className="truncate text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {product.name}
            </p>
            <p className="tienda-sticky-cta-price">{formatCLP(product.price)}</p>
          </div>
          <AddToCartButton product={product} disabled={!inStock} className="tienda-sticky-cta-btn" />
        </div>
      </div>
    </main>
  );
}
