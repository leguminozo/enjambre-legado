'use client';

import Link from 'next/link';
import { useCart } from '@/components/shop/cart-context';
import { useState } from 'react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { Lock, Shield } from 'lucide-react';

export function CheckoutClient() {
  const cart = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWebpay = async () => {
    setLoading(true);
    setError(null);
    const returnUrl = `${window.location.origin}/checkout/resultado`;
    const res = await fetch('/api/checkout/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total: cart.subtotal, returnUrl }),
    });
    const json = (await res.json()) as { url?: string; token?: string; error?: string };
    if (!res.ok || !json.url || !json.token) {
      setError(json.error || 'No se pudo iniciar el pago');
      setLoading(false);
      return;
    }

    sessionStorage.setItem(
      'oyz_pending_checkout',
      JSON.stringify({
        cart: cart.lines,
        total: cart.subtotal,
      }),
    );

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = json.url;
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token_ws';
    tokenInput.value = json.token;
    form.appendChild(tokenInput);
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[60vh] bg-background pb-16">
        <div className="border-b border-border px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">Checkout</h1>
            <p className="mt-2 text-muted-foreground">Revisión del pedido y pago seguro con Transbank.</p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          {cart.lines.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">Tu carrito está vacío.</p>
              <Link href="/catalogo" className="mt-4 inline-block text-sm font-semibold text-accent underline">
                Explorar creaciones
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <ul className="divide-y divide-border rounded-xl border border-border bg-card/40 px-5 py-2">
                {cart.lines.map((line) => (
                  <li key={line.productId} className="flex justify-between gap-4 py-4 text-sm">
                    <span className="text-foreground/80">
                      <span className="font-medium">{line.name}</span>
                      <span className="text-muted-foreground"> × {line.quantity}</span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums text-foreground">
                      ${(line.unitPrice * line.quantity).toLocaleString('es-CL')}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-surface-sunken px-6 py-5">
                <span className="font-display text-lg text-foreground">Total</span>
                <span className="font-display text-2xl font-semibold tabular-nums text-accent">
                  ${cart.subtotal.toLocaleString('es-CL')}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-accent" aria-hidden />
                  Pago encriptado
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-accent" aria-hidden />
                  Transbank Webpay Plus
                </span>
              </div>

              {error ? (
                <p className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                className="w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50"
                disabled={loading}
                onClick={() => void startWebpay()}
              >
                {loading ? 'Conectando con Webpay…' : 'Pagar con Transbank'}
              </button>
            </div>
          )}
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
