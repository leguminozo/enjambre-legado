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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Creaciones · Catálogo',
  description:
    'Miel cruda del bosque nativo de Chiloé. Sachets, frascos y suscripciones con trazabilidad regenerativa — La Obrera y el Zángano.',
  alternates: { canonical: `${SITE_URL}/catalogo` },
  openGraph: {
    title: 'Creaciones · Catálogo',
    description:
      'Miel cruda del bosque nativo de Chiloé. Sachets, frascos y suscripciones con trazabilidad regenerativa.',
    url: `${SITE_URL}/catalogo`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creaciones · Catálogo',
    description:
      'Miel cruda del bosque nativo de Chiloé. Sachets, frascos y suscripciones con trazabilidad regenerativa.',
  },
};

export default async function CatalogoPage() {
  let products = [] as Awaited<ReturnType<typeof listVisibleProducts>>;
  let loadError: string | null = null;
  let ratings: Awaited<ReturnType<typeof fetchRatingAggregatesByProduct>> = {};
  try {
    products = await listVisibleProducts();
    ratings = await fetchRatingAggregatesByProduct(products.map((p) => p.id));
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Error cargando catálogo';
  }

  const listSchema = products.length > 0
    ? itemListJsonLd(products.map((p, i) => ({ name: p.name, slug: p.slug, position: i + 1 })))
    : null;

  return (
    <StoreShell>
      <ShopHeader />
      {listSchema && <JsonLd data={listSchema} />}
      <main className="min-h-[50vh] bg-background">
        {loadError ? (
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-destructive/80">
              <p className="font-semibold">No se pudo cargar el catálogo.</p>
              <p className="mt-2 text-sm opacity-90">{loadError}</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
            <p className="text-muted-foreground">
              Aún no hay productos publicados.{' '}
        <Link href="/perfil" className="text-accent underline">
          Panel de control
        </Link>
            </p>
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
