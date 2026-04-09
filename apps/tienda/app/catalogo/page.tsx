import Link from 'next/link';
import { listVisibleProducts } from '@/lib/shop/products';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';

export const metadata = {
  title: 'Creaciones · Catálogo',
};

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function CatalogoPage() {
  let products = [] as Awaited<ReturnType<typeof listVisibleProducts>>;
  let loadError: string | null = null;
  try {
    products = await listVisibleProducts();
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Error cargando catálogo';
  }

  return (
    <>
      <ShopHeader />
      <main className="min-h-[60vh] bg-cream-50">
        <div className="border-b border-bosque-900/8 bg-gradient-to-r from-cream-100 to-cream-50 px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-miel-800">Tienda</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-bosque-950 sm:text-5xl">
              Creaciones
            </h1>
            <p className="mt-4 max-w-2xl text-bosque-800/75">
              La materia de nuestras búsquedas — productos visibles con legado del bosque chilote.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          {loadError ? (
            <div className="rounded-2xl border border-miel-600/30 bg-miel-50 p-6 text-bosque-900">
              <p className="font-semibold">No se pudo cargar el catálogo.</p>
              <p className="mt-2 text-sm opacity-90">{loadError}</p>
            </div>
          ) : null}

          {products.length === 0 && !loadError ? (
            <p className="max-w-xl text-bosque-800/70">
              Aún no hay productos publicados. Puedes cargarlos desde el{' '}
              <Link href="/dashboard" className="font-semibold text-miel-800 underline underline-offset-2">
                panel de administración
              </Link>
              .
            </p>
          ) : null}

          {products.length > 0 ? (
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => {
                const img = p.photos[0];
                return (
                  <li key={p.id}>
                    <Link
                      href={`/producto/${encodeURIComponent(p.slug)}`}
                      className="group block overflow-hidden rounded-2xl border border-bosque-900/10 bg-white shadow-sm transition hover:border-miel-600/35 hover:shadow-lg"
                    >
                      <div className="aspect-[4/3] bg-cream-100">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-bosque-800/40">
                            Sin imagen
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        {p.format ? (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-miel-800">
                            {p.format}
                          </p>
                        ) : null}
                        <h2 className="mt-1 font-display text-lg font-semibold text-bosque-950 group-hover:text-bosque-900">
                          {p.name}
                        </h2>
                        <p className="mt-2 text-sm font-medium text-bosque-800/80">{formatCLP(p.price)}</p>
                        <p className="mt-2 text-xs text-bosque-800/50">
                          {p.stock == null
                            ? 'Stock por confirmar'
                            : p.stock > 0
                              ? `Disponible`
                              : 'Sin stock'}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </main>
      <ShopFooter />
    </>
  );
}
