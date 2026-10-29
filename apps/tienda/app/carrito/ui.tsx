'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, RotateCcw, ShieldCheck, ShoppingBag, CheckCircle2, Trash2, Truck, MapPin, Package } from 'lucide-react';
import { useCartLines } from '@/components/shop/cart-context';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { alignToClass } from '@/lib/shop/store-chrome';
import { formatCLP } from '@/lib/shop/format';
import { ViewLoadingPlaceholder } from '@enjambre/ui';
import {
  SHIPPING_REGION_STORAGE_KEY,
  readCommerceStorage,
  writeCommerceStorage,
} from '@/lib/shop/commerce-storage';
import {
  CHILE_REGIONES,
  computeShippingCostWithRates,
  getRegionShippingEta,
  isChileRegion,
  type ShippingRatesConfig,
} from '@enjambre/logistica';

export function CarritoClient({ shippingRates }: { shippingRates?: ShippingRatesConfig }) {
  const { lines, hydrated, setQty, changeQty, remove, subtotal, itemCount } = useCartLines();
  // Copy del carrito editable desde el Editor de Tienda (cart_settings)
  const { cart } = useStoreChrome();
  const [selectedRegion, setSelectedRegion] = useState<string>('Metropolitana');

  useEffect(() => {
    const storedRegion = readCommerceStorage(SHIPPING_REGION_STORAGE_KEY)?.trim();
    if (storedRegion && isChileRegion(storedRegion)) {
      setSelectedRegion(storedRegion);
    } else {
      writeCommerceStorage(SHIPPING_REGION_STORAGE_KEY, 'Metropolitana');
    }
  }, []);

  const handleRegionChange = (nextRegion: string) => {
    setSelectedRegion(nextRegion);
    writeCommerceStorage(SHIPPING_REGION_STORAGE_KEY, nextRegion);
  };

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

  const regionEta = getRegionShippingEta(selectedRegion, shippingRates);
  const estimatedTotal = subtotal + shippingCost;
  const isShippingFree = shippingCost === 0;
  const firstLine = lines[0];
  const canUnlockWithOneMore =
    !isUnlocked &&
    Boolean(firstLine) &&
    remaining > 0 &&
    remaining <= (firstLine?.unitPrice ?? 0) &&
    shippingCost > 0;

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
          {canUnlockWithOneMore && firstLine ? (
            <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                Suma 1 unidad adicional y ahorra los <strong className="text-foreground font-semibold">{formatCLP(shippingCost)}</strong> de envío:
              </span>
              <button
                type="button"
                onClick={() => changeQty(firstLine.productId, 1)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent-text hover:bg-accent/20 transition-colors shrink-0"
              >
                <Plus size={13} />
                Sumar 1 {firstLine.name} (Envío gratis)
              </button>
            </div>
          ) : null}
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
                    else changeQty(line.productId, -1);
                  }}
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">{line.quantity}</span>
                <button
                  type="button"
                  aria-label="Aumentar cantidad"
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
                  onClick={() => changeQty(line.productId, 1)}
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

      {/* Resumen Unificado + Cotizador Regional Persistente */}
      <div className="mt-6 rounded-xl border border-border bg-card/40 px-4 py-5 sm:px-6 space-y-3.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{cart.subtotal_label}</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatCLP(subtotal)}
          </span>
        </div>

        <div className="pt-3 border-t border-border/50 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent shrink-0" />
              <label htmlFor="region-select" className="text-muted-foreground">
                Región de despacho
              </label>
              <select
                id="region-select"
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {CHILE_REGIONES.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>
            <span className={`font-semibold tabular-nums ${isShippingFree ? 'text-accent' : 'text-foreground'}`}>
              {isShippingFree ? '✨ Gratis' : formatCLP(shippingCost)}
            </span>
          </div>
          {regionEta ? (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-accent/80 shrink-0" />
              <span>Plazo estimado: {regionEta}</span>
            </p>
          ) : null}
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between text-base">
          <span className="font-medium text-foreground">Total estimado</span>
          <span className="font-display text-xl font-semibold tabular-nums text-accent-text">
            {formatCLP(estimatedTotal)}
          </span>
        </div>
        {cart.shipping_note.trim() ? (
          <p className="text-[11px] text-muted-foreground">{cart.shipping_note}</p>
        ) : null}
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

      {/* Protección de envases y respaldo legal SERNAC (100% editable desde CMS) */}
      <div className="mt-8 rounded-xl border border-border/80 bg-card/40 p-4 text-xs space-y-3" data-testid="cart-legal-guarantee-banner">
        {cart.protection_badge_title.trim() ? (
          <div className="flex items-start gap-2.5 pb-3 border-b border-border/40">
            <Package className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">{cart.protection_badge_title}</p>
              {cart.protection_badge_desc.trim() ? (
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {cart.protection_badge_desc}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">{cart.legal_warranty_title}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {cart.legal_warranty_desc}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <RotateCcw className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">{cart.retract_title}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {cart.retract_desc}
              </p>
            </div>
          </div>
        </div>
        <div className="pt-2.5 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
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
