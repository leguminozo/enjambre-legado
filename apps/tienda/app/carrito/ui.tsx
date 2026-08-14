'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCartLines } from '@/components/shop/cart-context';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { formatCLP } from '@/lib/shop/format';
import { ViewLoadingPlaceholder } from '@enjambre/ui';

export function CarritoClient() {
  const { lines, hydrated, setQty, remove, subtotal, itemCount } = useCartLines();
  // Copy del carrito editable desde el Editor de Tienda (cart_settings)
  const { cart } = useStoreChrome();

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
        <p className="mt-2 text-sm text-muted-foreground">{cart.empty_desc}</p>
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

      <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-card/40 sm:mt-8">
        {lines.map((line) => (
          <li
            key={line.productId}
            data-testid="cart-item"
            className="cart-item flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
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

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center rounded-full border border-border bg-background">
                <button
                  type="button"
                  aria-label="Disminuir cantidad"
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
                  onClick={() => setQty(line.productId, Math.max(1, line.quantity - 1))}
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

      <div className="mt-6 hidden rounded-xl border border-border bg-card/30 px-6 py-5 md:block">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{cart.subtotal_label}</span>
          <span className="font-display text-xl font-semibold tabular-nums text-accent-text">
            {formatCLP(subtotal)}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{cart.shipping_note}</p>
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

      {/* Sticky mobile CTA */}
      <div className="tienda-sticky-cta md:hidden" data-testid="cart-sticky-checkout">
        <div className="tienda-sticky-cta-inner">
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{cart.subtotal_label}</p>
            <p className="tienda-sticky-cta-price">{formatCLP(subtotal)}</p>
          </div>
          <Link href="/checkout" data-testid="proceed-checkout" className="tienda-sticky-cta-btn text-center">
            {cart.cta_label}
          </Link>
        </div>
      </div>
    </div>
  );
}
