'use client';

import Link from 'next/link';
import { useCart } from '@/components/shop/cart-context';
import { useState } from 'react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
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
    <>
      <ShopHeader />
      <main className="min-h-[60vh] bg-cream-50 pb-16">
        <div className="border-b border-bosque-900/8 bg-gradient-to-r from-cream-100 to-white px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl font-semibold text-bosque-950 sm:text-4xl">Checkout</h1>
            <p className="mt-2 text-bosque-800/70">Revisión de tu pedido y pago seguro con Transbank.</p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          {cart.lines.length === 0 ? (
            <div className="rounded-2xl border border-bosque-900/10 bg-white p-8 text-center">
              <p className="text-bosque-800/80">Tu carrito está vacío.</p>
              <Link
                href="/catalogo"
                className="mt-4 inline-block text-sm font-semibold text-miel-800 underline underline-offset-2"
              >
                Explorar creaciones
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <ul className="divide-y divide-bosque-900/8 rounded-2xl border border-bosque-900/10 bg-white px-5 py-2 shadow-sm">
                {cart.lines.map((line) => (
                  <li key={line.productId} className="flex justify-between gap-4 py-4 text-sm">
                    <span className="text-bosque-900">
                      <span className="font-medium">{line.name}</span>
                      <span className="text-bosque-800/60"> × {line.quantity}</span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums text-bosque-900">
                      ${(line.unitPrice * line.quantity).toLocaleString('es-CL')}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between rounded-2xl bg-bosque-900 px-6 py-5 text-cream-50">
                <span className="font-display text-lg">Total</span>
                <span className="font-display text-2xl font-semibold tabular-nums">
                  ${cart.subtotal.toLocaleString('es-CL')}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-bosque-800/65">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-miel-700" aria-hidden />
                  Pago encriptado
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-miel-700" aria-hidden />
                  Transbank Webpay Plus
                </span>
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
              ) : null}

              <button
                type="button"
                className="w-full rounded-full bg-miel-700 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-miel-800/20 transition hover:bg-miel-600 disabled:opacity-50"
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
    </>
  );
}
