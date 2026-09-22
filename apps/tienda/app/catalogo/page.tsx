import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { listVisibleProducts } from '@/lib/shop/products';
import { fetchRatingAggregatesByProduct } from '@/lib/shop/catalog-ratings';
import { itemListJsonLd } from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { CreatorRefCapture } from '@/components/shop/creator-ref-capture';
import { CatalogoView } from './catalog-view';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

import { createPageMetadata } from '@/lib/shop/page-metadata';

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('/catalogo', {
    title: 'Creaciones · Catálogo',
    description:
      'Miel cruda del bosque nativo de Chiloé. Sachets, frascos y recolecciones con trazabilidad y origen de patrimonio forestal — La Obrera y el Zángano.',
  });
}

export default async function CatalogoPage() {
  let products = [] as Awaited<ReturnType<typeof listVisibleProducts>>;
  let loadError: string | null = null;
  let ratings: Awaited<ReturnType<typeof fetchRatingAggregatesByProduct>> = {};
  try {
    products = await listVisibleProducts();
    ratings = await fetchRatingAggregatesByProduct(products.map((p) => p.id));
  } catch (e) {
    loadError = 'No pudimos cargar el catálogo. Intenta de nuevo en unos minutos.';
  }

  const listSchema = products.length > 0
    ? (() => {
        // Ratings keyed por slug para el ItemList (rich results de estrellas)
        const ratingsBySlug: Record<string, { ratingValue: number; reviewCount: number }> = {};
        for (const p of products) {
          const r = ratings[p.id];
          if (r) ratingsBySlug[p.slug] = r;
        }
        return itemListJsonLd(
          products.map((p, i) => ({ name: p.name, slug: p.slug, position: i + 1 })),
          ratingsBySlug,
        );
      })()
    : null;

  return (
    <StoreShell>
      <ShopHeader />
      {listSchema && <JsonLd data={listSchema} />}
      <main className="min-h-[50vh] bg-background">
        {loadError ? (
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 text-center">
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-destructive/80">
              <p className="font-semibold">No se pudo cargar el catálogo.</p>
              <p className="mt-2 text-sm opacity-90">{loadError}</p>
            </div>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground hover:border-accent/40 hover:text-accent transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <Suspense fallback={<p className="py-16 text-center text-muted-foreground">Cargando catálogo…</p>}>
            <CreatorRefCapture />
            <CatalogoView products={products} ratings={ratings} />
          </Suspense>
        )}
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
