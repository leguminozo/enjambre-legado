import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StoreShell } from '@/components/shop/store-shell';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { CataView } from './cata-view';

const NUCLEO_URL = process.env.NEXT_PUBLIC_NUCLEO_URL || 'http://localhost:3000';

export async function generateMetadata({ params }: { params: Promise<{ codigo: string }> }): Promise<Metadata> {
  const p = await params;
  return {
    title: `Cata Sensorial · La Obrera y el Zángano`,
    description: 'Registra tu percepción sensorial y gana sellos de fidelidad.',
  };
}

export default async function CataPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  
  // Fetch punto de venta info
  const res = await fetch(`${NUCLEO_URL}/api/b2b-publico/portal/${codigo}`, {
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
  const chipsRes = await fetch(`${NUCLEO_URL}/api/b2b-publico/portal/chips`, {
    next: { revalidate: 3600 }
  });
  const chipsJson = await chipsRes.ok ? await chipsRes.json() : { data: [] };

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[var(--svh-full)] pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-20 bg-background">
        <CataView punto={punto} codigo={codigo} chipsCatalog={chipsJson.data} />
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
