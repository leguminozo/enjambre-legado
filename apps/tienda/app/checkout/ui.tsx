'use client';

import Link from 'next/link';
import { useCart } from '@/components/shop/cart-context';
import { useState } from 'react';

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
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-[#0A3D2F] mb-4">Checkout</h1>
        {cart.lines.length === 0 ? (
          <p className="text-stone-600">
            Tu carrito está vacío. <Link href="/catalogo" className="underline">Volver al catálogo</Link>
          </p>
        ) : (
          <div className="space-y-4">
            <ul className="bg-white border border-stone-200 rounded-2xl p-4">
              {cart.lines.map((line) => (
                <li key={line.productId} className="flex justify-between py-2 text-sm">
                  <span>
                    {line.name} x {line.quantity}
                  </span>
                  <span>${(line.unitPrice * line.quantity).toLocaleString('es-CL')}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${cart.subtotal.toLocaleString('es-CL')}</span>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              className="btn-primary w-full"
              disabled={loading}
              onClick={() => void startWebpay()}
            >
              {loading ? 'Iniciando Webpay...' : 'Pagar con Transbank'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

