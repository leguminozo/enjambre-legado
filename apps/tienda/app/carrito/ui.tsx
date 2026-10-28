'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, RotateCcw, ShieldCheck, ShoppingBag, CheckCircle2, Trash2, Truck, MapPin } from 'lucide-react';
import { useCartLines } from '@/components/shop/cart-context';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { alignToClass } from '@/lib/shop/store-chrome';
import { formatCLP } from '@/lib/shop/format';
import { ViewLoadingPlaceholder } from '@enjambre/ui';
import {
  CHILE_REGIONES,
  computeShippingCostWithRates,
  type ShippingRatesConfig,
} from '@enjambre/logistica';

export function CarritoClient({ shippingRates }: { shippingRates?: ShippingRatesConfig }) {
  const { lines, hydrated, setQty, remove, subtotal, itemCount } = useCartLines();
  // Copy del carrito editable desde el Editor de Tienda (cart_settings)
  const { cart } = useStoreChrome();
  const [selectedRegion, setSelectedRegion] = useState<string>('Metropolitana');

  const isFreeShippingEnabled = cart.free_shipping_enabled !== false;
  const threshold = cart.free_shipping_threshold_clp ?? 45000;
  const isUnlocked = subtotal >= threshold;
  const remaining = Math.max(0, threshold - subtotal);
  const percent = Math.min(100, Math.round((subtotal / threshold) * 100));

  const shippingCost = computeShippingCostWithRates(
    {
      region: selectedRegion,
      courierCode: 'blueexpress',
      subtotalClp: subtotal,
      freeShipping: isFreeShippingEnabled,
      freeShippingSubtotal: threshold,
    },
    shippingRates,
  );

  const estimatedTotal = subtotal + shippingCost;
  const isShippingFree = shippingCost === 0;

  const progressMsg = (cart.free_shipping_progress_text || 'Te faltan {amount} para despacho gratis')
    .replace('{amount}', formatCLP(remaining));
  const unlockedMsg = cart.free_shipping_unlocked_text || 'Despacho de cortesía incluido';

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ViewLoadingPlaceholder label="Carrito" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-[max(4rem,calc(var(--safe-top)+3rem))] pb-16 sm:py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <h1 className="font-display text-2xl font-semibold text-foreground text-balance">{cart.empty_title}</h1>
        {cart.empty_desc.trim() ? (
          <p className={`mt-2 text-sm text-muted-foreground whitespace-pre-line ${alignToClass(cart.text_align)}`}>{cart.empty_desc}</p>
        ) : null}
        <Link
          href="/catalogo"
          className="mt-8 inline-flex min-h-[48px] items-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          {cart.empty_cta}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-[max(2rem,calc(var(--safe-top)+0.5rem))] pb-32 sm:px-6 sm:py-14 md:pb-14">
      <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl text-balance">Tu carrito</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
      </p>

      {isFreeShippingEnabled && (
        <div
          className="mt-5 rounded-xl border border-border bg-card/60 p-4 transition-all"
          data-testid="cart-free-shipping-progress"
        >
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              {isUnlocked ? (
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
              ) : (
                <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              {isUnlocked ? unlockedMsg : progressMsg}
            </span>
            <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
              {percent}%
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isUnlocked ? 'bg-accent' : 'bg-accent/80'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-card/40 sm:mt-8">
        {lines.map((line) => (
          <li
            key={line.productId}
            data-testid="cart-item"
            className="cart-item flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
              <Link
                href={`/producto/${encodeURIComponent(line.slug)}`}
                className="group relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-card hover:border-accent/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-hidden="true"
                tabIndex={-1}
              >
                {line.imageUrl ? (
                  <Image
                    src={line.imageUrl}
                    alt={line.name}
                    fill
                    sizes="(max-width: 640px) 64px, 80px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-card text-muted-foreground/40">
                    <ShoppingBag className="h-6 w-6 stroke-1" aria-hidden="true" />
                  </div>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/producto/${encodeURIComponent(line.slug)}`}
                  className="inline-flex min-h-11 items-center font-medium text-foreground hover:text-accent transition-colors"
                >
                  {line.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  {formatCLP(line.unitPrice)} c/u
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center rounded-full border border-border bg-background">
                <button
                  type="button"
                  aria-label={line.quantity <= 1 ? 'Eliminar del carrito' : 'Disminuir cantidad'}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (line.quantity <= 1) remove(line.productId);
                    else setQty(line.productId, line.quantity - 1);
                  }}
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">{line.quantity}</span>
                <button
                  type="button"
                  aria-label="Aumentar cantidad"
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
                  onClick={() => setQty(line.productId, line.quantity + 1)}
                >
                  <Plus size={16} />
                </button>
              </div>

              <span className="w-20 text-right text-sm font-semibold tabular-nums text-foreground sm:w-24">
                {formatCLP(line.unitPrice * line.quantity)}
              </span>

              <button
                type="button"
                aria-label="Eliminar"
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => remove(line.productId)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Cotizador Regional de Despacho */}
      <div className="mt-6 rounded-xl border border-border/70 bg-card/50 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-accent shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              Despacho a Domicilio (Chile)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <label htmlFor="region-select" className="sr-only">Seleccionar región</label>
            <select
              id="region-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {CHILE_REGIONES.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
          <span className="text-muted-foreground">
            Tarifa estimada ({selectedRegion})
          </span>
          <span className={`font-semibold tabular-nums ${isShippingFree ? 'text-accent' : 'text-foreground'}`}>
            {isShippingFree ? '✨ Gratis' : formatCLP(shippingCost)}
          </span>
        </div>
      </div>

      <div className="mt-6 hidden rounded-xl border border-border bg-card/30 px-6 py-5 md:block space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{cart.subtotal_label}</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatCLP(subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Despacho estimado ({selectedRegion})</span>
          <span className={`tabular-nums ${isShippingFree ? 'font-semibold text-accent' : 'text-foreground'}`}>
            {isShippingFree ? 'Gratis' : formatCLP(shippingCost)}
          </span>
        </div>
        <div className="pt-3 border-t border-border flex items-center justify-between text-base">
          <span className="font-medium text-foreground">Total estimado</span>
          <span className="font-display text-xl font-semibold tabular-nums text-accent-text">
            {formatCLP(estimatedTotal)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">{cart.shipping_note}</p>
      </div>

      <div className="mt-8 hidden flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:flex">
        <Link
          href="/catalogo"
          className="inline-flex min-h-11 items-center justify-center text-center text-sm text-accent underline underline-offset-2 hover:text-accent/80"
        >
          Seguir comprando
        </Link>
        <Link
          href="/checkout"
          data-testid="proceed-checkout"
          className="rounded-full bg-primary px-10 py-4 text-center text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:bg-primary/80 min-h-[48px] flex items-center justify-center"
        >
          {cart.cta_label}
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-center md:hidden">
        <Link
          href="/catalogo"
          className="inline-flex min-h-11 items-center justify-center text-center text-sm text-accent underline underline-offset-2 hover:text-accent/80"
        >
          Seguir comprando
        </Link>
      </div>

      {/* Respaldo legal y de consumo SERNAC */}
      <div className="mt-8 rounded-xl border border-border/80 bg-card/40 p-4 text-xs" data-testid="cart-legal-guarantee-banner">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">Garantía Legal de 6 meses</p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Protección irrenunciable (Ley 19.496 / Ley 21.398). Opción de reparación, reemplazo o devolución ante cualquier defecto.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <RotateCcw className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">Derecho a retracto de 10 días</p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                En compras web con precinto de seguridad intacto (Art. 3 bis Ley 19.496 y DS 6/2021).
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>Precios finales con IVA (19%) incluido</span>
          <span>Boleta o Factura electrónica directa del SII</span>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="tienda-sticky-cta md:hidden" data-testid="cart-sticky-checkout">
        <div className="tienda-sticky-cta-inner">
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              Total estimado ({selectedRegion})
            </p>
            <p className="tienda-sticky-cta-price">{formatCLP(estimatedTotal)}</p>
          </div>
          <Link href="/checkout" data-testid="proceed-checkout" className="tienda-sticky-cta-btn text-center">
            {cart.cta_label}
          </Link>
        </div>
      </div>
    </div>
  );
}
