import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StoreShell } from '@/components/shop/store-shell';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { listVisibleProducts } from '@/lib/shop/products';
import { requireNucleoApiUrl } from '@/lib/shop/nucleo-url';
import { CataView } from './cata-view';

export async function generateMetadata({ params }: { params: Promise<{ codigo: string }> }): Promise<Metadata> {
  const p = await params;
  return {
    title: `Cata Sensorial · La Obrera y el Zángano`,
    description: 'Registra tu percepción sensorial, reseña el producto y gana sellos de fidelidad.',
  };
}

export default async function CataPage({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ producto?: string }>;
}) {
  const { codigo } = await params;
  const { producto: initialProductSlugOrId } = await searchParams;
  const nucleoUrl = requireNucleoApiUrl();
  
  // Fetch punto de venta info
  const res = await fetch(`${nucleoUrl}/api/b2b-publico/portal/${codigo}`, {
    next: { revalidate: 60 }
  });
  
  if (!res.ok) {
    notFound();
  }
  
  const json = await res.json();
  const punto = json.data?.punto;
  
  if (!punto) {
    notFound();
  }

  // Fetch chips
  const chipsRes = await fetch(`${nucleoUrl}/api/b2b-publico/portal/chips`, {
    next: { revalidate: 3600 }
  });
  const chipsJson = chipsRes.ok ? await chipsRes.json() : { data: [] };

  // Fetch visible products from store catalog
  let products: Awaited<ReturnType<typeof listVisibleProducts>> = [];
  try {
    products = await listVisibleProducts();
  } catch {
    // Fallback to empty catalog on db error
  }

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[var(--svh-full)] pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-20 bg-background">
        <CataView
          punto={punto}
          codigo={codigo}
          chipsCatalog={chipsJson.data ?? []}
          products={products}
          initialProductSlugOrId={initialProductSlugOrId}
        />
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
