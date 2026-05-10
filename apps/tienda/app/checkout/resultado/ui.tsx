'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/shop/cart-context';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar con token
  }, [token]);

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[50vh] bg-background px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl">
          <div className="rounded-xl border border-border bg-card/50 p-8">
            <h1 className="font-display text-2xl font-semibold text-foreground">Resultado del pago</h1>
            <p
              className={`mt-4 text-base ${
                state === 'success'
                  ? 'text-success'
                  : state === 'failed'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
              }`}
            >
              {message}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/catalogo"
                className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80"
              >
                Volver a la tienda
              </Link>
              <Link href="/" className="inline-flex items-center text-sm font-semibold text-accent underline">
                Ir al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
