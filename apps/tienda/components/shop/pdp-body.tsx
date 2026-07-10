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
import { TraceabilitySection } from '@/app/producto/[slug]/ui';
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
    <main className="bg-background pb-16">
      {pdp.show_breadcrumb ? (
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <Link href="/" className="hover:text-accent">
              Inicio
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <Link href="/catalogo" className="hover:text-accent">
              Creaciones
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <span className="font-medium text-foreground/70">{product.name}</span>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:gap-14 sm:px-6 lg:grid-cols-[1fr_minmax(280px,400px)] lg:items-start lg:py-14">
        <ProductGallery photos={product.photos} alt={product.name} />

        <div className="lg:sticky lg:top-28">
          {pdp.show_format_badge && product.format ? (
            <span className="inline-block rounded bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              {product.format}
            </span>
          ) : null}
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 font-display text-2xl text-accent">{formatCLP(product.price)}</p>

          {product.description ? (
            <div className="mt-8 border-l-2 border-accent/60 pl-5">
              <p className="whitespace-pre-line leading-relaxed text-foreground/70">
                {product.description}
              </p>
            </div>
          ) : (
            <p className="mt-8 text-sm italic text-muted-foreground/60">
              Descripción disponible pronto.
            </p>
          )}

          {pdp.show_badges ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.sustituye_azucar_g ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-3 py-1 text-[9px] uppercase tracking-wider text-accent/80">
                  Sustituye ~{product.sustituye_azucar_g}g azúcar refinada
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
                Miel viva · Enzimas activas
              </span>
              {product.irr_referencia && product.irr_referencia > 1 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 px-3 py-1 text-[9px] uppercase tracking-wider text-success/80">
                  IRR {product.irr_referencia} · Impacto &gt; Huella
                </span>
              )}
            </div>
          ) : null}

          <ProductPurchaseActions
            product={product}
            plans={pdp.show_replenishment ? plans : []}
            inStock={inStock}
          />

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
            className="mt-10 inline-flex text-sm font-medium text-accent hover:underline"
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
    </main>
  );
}
