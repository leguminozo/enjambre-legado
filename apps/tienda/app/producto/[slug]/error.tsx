'use client';

import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { useEffect } from 'react';

export default function ProductoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[producto-error-boundary]', error);
  }, [error]);

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[50vh] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-2xl font-semibold text-foreground">No se pudo cargar</h1>
          <p className="mt-2 text-muted-foreground">{error.message || 'Error inesperado cargando el producto'}</p>
          <div className="mt-6 flex items-center gap-4">
            <button onClick={reset} className="text-sm font-medium hover:underline text-foreground">
              Reintentar
            </button>
            <Link href="/catalogo" className="text-sm text-accent underline">
              Volver a creaciones
            </Link>
          </div>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
