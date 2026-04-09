'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/shop/cart-context';

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
  }, [token]);

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="max-w-xl mx-auto bg-white border border-stone-200 rounded-2xl p-6">
        <h1 className="text-2xl font-serif font-bold text-[#0A3D2F] mb-2">Resultado del pago</h1>
        <p className={state === 'success' ? 'text-green-700' : state === 'failed' ? 'text-red-700' : 'text-stone-600'}>
          {message}
        </p>
        <div className="mt-6">
          <Link href="/catalogo" className="underline text-[#0A3D2F]">
            Volver al catálogo
          </Link>
        </div>
      </div>
    </main>
  );
}

