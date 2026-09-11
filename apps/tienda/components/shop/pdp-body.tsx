'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect, useMemo, useRef } from 'react';
import { ChevronRight, FlaskConical, RotateCcw, ShieldCheck } from 'lucide-react';
import { formatCLP } from '@/lib/shop/format';
import { type ShopProduct, resolveProductBadges } from '@/lib/shop/products';
import type { ReplenishmentPlan } from '@/lib/shop/replenishment';
import { ProductGallery } from '@/components/shop/product-gallery';
import { ProductPurchaseActions } from '@/components/shop/product-purchase-actions';
import { ResenasSection } from '@/components/shop/resenas-section';
import { PerfilSensorialSection } from '@/components/shop/perfil-sensorial-section';
import { TraceabilitySection, AddToCartButton } from '@/app/producto/[slug]/ui';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { resolveLocalized } from '@/lib/shop/store-chrome';
import { useMetaTracking } from '@/lib/tracking/client';

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
  const track = useMetaTracking();
  const viewedRef = useRef(false);
  const badges = useMemo(() => resolveProductBadges(product), [product]);

  // ViewContent (Meta) — una vez por montaje del PDP (gatea por consentimiento)
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    track({
      eventName: 'ViewContent',
      value: Math.round(product.price),
      currency: 'CLP',
      contentIds: [product.id],
      contents: [{ id: product.id, quantity: 1, itemPrice: product.price }],
      contentName: product.name,
    });
  }, [track, product.id, product.name, product.price]);

  return (
    <main className="bg-background pb-28 md:pb-16">
      {pdp.show_breadcrumb ? (
        <div className="border-b border-border px-4 py-2 sm:px-6 sm:py-3 md:py-4">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <Link
              href="/catalogo"
              className="inline-flex min-h-11 items-center font-medium text-accent-text hover:text-accent/80 md:hidden"
            >
              ← Catálogo
            </Link>
            <span className="hidden md:contents">
              <Link href="/" className="inline-flex min-h-11 items-center hover:text-accent">
                Inicio
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              <Link href="/catalogo" className="inline-flex min-h-11 items-center hover:text-accent">
                Creaciones
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              <span className="inline-flex min-h-11 items-center font-medium text-foreground/70">
                {product.name}
              </span>
            </span>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-6xl gap-8 px-0 py-0 sm:gap-14 sm:px-6 sm:py-10 lg:grid-cols-[1fr_minmax(280px,400px)] lg:items-start lg:px-6 lg:py-14">
        <div className="px-0 sm:px-0">
          <ProductGallery photos={product.photos} alt={product.name} />
        </div>

        <div className="px-4 sm:px-0 lg:sticky lg:top-28">
          {pdp.show_format_badge && (product.formatLabel || product.format) ? (
            <span className="inline-block rounded bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              {product.formatLabel ?? product.format}
            </span>
          ) : null}
          <h1 className="mt-3 font-display text-2xl font-semibold leading-tight text-foreground text-balance sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 font-display text-xl tabular-nums text-accent-text sm:text-2xl md:mt-4">
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

          {pdp.show_badges && badges.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
              {badges.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-3 py-1 text-[9px] uppercase tracking-wider text-accent-text"
                >
                  {b}
                </span>
              ))}
            </div>
          ) : null}

          {product.ingredientes ? (
            <div className="mt-4 rounded-lg border border-border/60 bg-card/40 p-3 text-xs">
              <span className="font-semibold text-foreground/90 uppercase tracking-wider text-[10px] block mb-1">
                Ingredientes
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {product.ingredientes}
              </p>
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

          {/* Garantías legales SERNAC y respaldo científico */}
          <div className="mt-6 rounded-xl border border-border/70 bg-card/30 p-3.5 text-xs">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <ShieldCheck className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                <span>Garantía Legal de 6 meses (Ley 19.496 / 21.398)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5 text-accent/80 shrink-0" aria-hidden="true" />
                <span>Derecho a retracto de 10 días (con precinto intacto)</span>
              </div>
              <div className="mt-1 pt-2 border-t border-border/40 flex items-start gap-2 text-[11px] text-muted-foreground">
                <FlaskConical className="h-3.5 w-3.5 text-accent/80 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span>Alimento natural del bosque nativo. Conoce nuestra </span>
                  <Link href="/ciencia" className="text-accent underline underline-offset-2 hover:text-accent/80 font-medium">
                    evidencia botánica y organoléptica
                  </Link>
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                    No constituye consejo médico ni diagnóstico de salud (Reglamento Sanitario de los Alimentos).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {pdp.show_traceability && (product.trazabilidadQr ?? true) ? (
            <TraceabilitySection
              slug={product.slug}
              blockchainHash={product.blockchain_hash}
              colmenaOrigen={product.colmena_origen}
              fechaCosecha={product.fecha_cosecha}
              fechaEnvasado={product.fecha_envasado}
              nombreLote={product.nombre_lote}
              descripcionLote={product.descripcion_lote}
              loteId={product.lote_id}
              lotePublico={product.lote_publico}
              videoUrl={product.videoUrl}
              origenApicola={product.origenApicola}
            />
          ) : null}

          <Link
            href="/catalogo"
            className="mt-8 inline-flex min-h-11 items-center text-sm font-medium text-accent-text hover:underline md:mt-10"
          >
            ← {continueLabel}
          </Link>
        </div>
      </div>

      {pdp.show_sensory_profile !== false &&
      (product.category === 'miel' ||
        !product.category ||
        product.tags.some((t) => t.toLowerCase().includes('miel'))) ? (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-8">
          <PerfilSensorialSection productName={product.name} />
        </div>
      ) : null}

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
