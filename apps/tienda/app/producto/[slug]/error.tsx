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
          <p className="mt-2 text-muted-foreground">No pudimos mostrar esta creación. Intenta de nuevo o vuelve al catálogo.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground hover:border-accent/40 hover:text-accent transition-colors"
            >
              Reintentar
            </button>
            <Link
              href="/catalogo"
              className="inline-flex min-h-11 items-center text-sm font-medium text-accent-text underline underline-offset-2"
            >
              Volver a creaciones
            </Link>
          </div>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
