import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';

export default function ProductoNotFound() {
  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[50vh] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-2xl font-semibold text-foreground">Producto no encontrado</h1>
          <p className="mt-2 text-muted-foreground">Revisa el enlace o vuelve al catálogo.</p>
          <Link href="/catalogo" className="mt-6 inline-block text-sm text-accent underline">
            Ir a creaciones
          </Link>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
