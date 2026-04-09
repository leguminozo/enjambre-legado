'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/shop/cart-context';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';

type CommitState = 'loading' | 'success' | 'failed';

export function CheckoutResultClient() {
  const params = useSearchParams();
  const token = params.get('token_ws');
  const [state, setState] = useState<CommitState>('loading');
  const [message, setMessage] = useState('Confirmando pago...');
  const cart = useCart();

  useEffect(() => {
    if (!token) {
      setState('failed');
      setMessage('No llegó token de Transbank.');
      return;
    }

    const raw = sessionStorage.getItem('oyz_pending_checkout');
    const pending = raw ? (JSON.parse(raw) as { cart: unknown[]; total: number }) : null;

    void (async () => {
      const res = await fetch('/api/checkout/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_ws: token,
          cart: pending?.cart || [],
          total: pending?.total || 0,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; authorized?: boolean; error?: string };
      if (!res.ok || !json.ok || !json.authorized) {
        setState('failed');
        setMessage(json.error || 'Pago no autorizado.');
        return;
      }
      sessionStorage.removeItem('oyz_pending_checkout');
      cart.clear();
      setState('success');
      setMessage('Pago confirmado. Tu pedido fue registrado.');
    })();
    // cart.clear estable desde el provider; no incluir cart en deps para evitar re-ejecuciones.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar con token
  }, [token]);

  return (
    <>
      <ShopHeader />
      <main className="min-h-[50vh] bg-cream-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-bosque-900/10 bg-white p-8 shadow-sm">
            <h1 className="font-display text-2xl font-semibold text-bosque-950">Resultado del pago</h1>
            <p
              className={`mt-4 text-base ${
                state === 'success'
                  ? 'text-emerald-800'
                  : state === 'failed'
                    ? 'text-red-700'
                    : 'text-bosque-800/70'
              }`}
            >
              {message}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/catalogo"
                className="inline-flex rounded-full bg-bosque-900 px-5 py-2.5 text-sm font-semibold text-cream-50 hover:bg-bosque-800"
              >
                Volver a la tienda
              </Link>
              <Link href="/" className="inline-flex items-center text-sm font-semibold text-miel-800 underline">
                Ir al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
      <ShopFooter />
    </>
  );
}
