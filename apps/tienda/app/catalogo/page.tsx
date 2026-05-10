import Link from 'next/link';
import { listVisibleProducts } from '@/lib/shop/products';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { CatalogoView } from './catalog-view';

export const metadata = {
  title: 'Creaciones · Catálogo',
};

export default async function CatalogoPage() {
  let products = [] as Awaited<ReturnType<typeof listVisibleProducts>>;
  let loadError: string | null = null;
  try {
    products = await listVisibleProducts();
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Error cargando catálogo';
  }

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[50vh] bg-background">
        {loadError ? (
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-red-200">
              <p className="font-semibold">No se pudo cargar el catálogo.</p>
              <p className="mt-2 text-sm opacity-90">{loadError}</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
            <p className="text-muted-foreground">
              Aún no hay productos publicados.{' '}
              <Link href="/dashboard" className="text-accent underline">
                Panel de administración
              </Link>
            </p>
          </div>
        ) : (
          <CatalogoView products={products} />
        )}
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
