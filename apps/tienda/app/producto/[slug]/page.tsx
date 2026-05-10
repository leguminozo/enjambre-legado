import type { ReactNode } from 'react';
import Link from 'next/link';
import { getProductBySlugOrId } from '@/lib/shop/products';
import { formatCLP } from '@/lib/shop/format';
import { AddToCartButton } from './ui';
import { ProductGallery } from '@/components/shop/product-gallery';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { ChevronRight } from 'lucide-react';

function Shell({ children }: { children: ReactNode }) {
  return (
    <StoreShell>
      <ShopHeader />
      {children}
      <ShopFooter />
    </StoreShell>
  );
}

export default async function ProductoPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  let product = null as Awaited<ReturnType<typeof getProductBySlugOrId>>;
  let loadError: string | null = null;
  try {
    product = await getProductBySlugOrId(slug);
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Error cargando producto';
  }

  if (loadError) {
    return (
    <Shell>
      <main className="min-h-[50vh] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-2xl font-semibold text-foreground">No se pudo cargar</h1>
          <p className="mt-2 text-muted-foreground">{loadError}</p>
          <Link href="/catalogo" className="mt-6 inline-block text-sm text-accent underline">
            Volver a creaciones
          </Link>
        </div>
      </main>
    </Shell>
    );
  }

  if (!product) {
    return (
    <Shell>
      <main className="min-h-[50vh] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-2xl font-semibold text-foreground">Producto no encontrado</h1>
          <p className="mt-2 text-muted-foreground">Revisa el enlace o vuelve al catálogo.</p>
          <Link href="/catalogo" className="mt-6 inline-block text-sm text-accent underline">
            Ir a creaciones
          </Link>
        </div>
      </main>
    </Shell>
    );
  }

  const inStock = product.stock == null || product.stock > 0;

  return (
    <Shell>
      <main className="bg-background pb-16">
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <Link href="/" className="hover:text-accent">
              Inicio
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <Link href="/catalogo" className="hover:text-accent">
              Creaciones
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <span className="font-medium text-foreground/70">{product.name}</span>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:gap-14 sm:px-6 lg:grid-cols-[1fr_minmax(280px,400px)] lg:items-start lg:py-14">
          <ProductGallery photos={product.photos} alt={product.name} />

          <div className="lg:sticky lg:top-28">
            {product.format ? (
              <span className="inline-block rounded bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                {product.format}
              </span>
            ) : null}
            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 font-display text-2xl text-accent">{formatCLP(product.price)}</p>

            {product.description ? (
              <div className="mt-8 border-l-2 border-accent/60 pl-5">
                <p className="whitespace-pre-line leading-relaxed text-foreground/70">{product.description}</p>
              </div>
            ) : (
              <p className="mt-8 text-sm italic text-muted-foreground/60">Descripción disponible pronto.</p>
            )}

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <AddToCartButton product={product} disabled={!inStock} />
              <span className="text-sm text-muted-foreground">
                {product.stock == null
                  ? 'Stock por confirmar'
                  : product.stock > 0
                    ? `${product.stock} disponibles`
                    : 'Sin stock'}
              </span>
            </div>

            <Link href="/catalogo" className="mt-10 inline-flex text-sm font-medium text-accent hover:underline">
              ← Seguir explorando
            </Link>
          </div>
        </div>
      </main>
    </Shell>
  );
}
