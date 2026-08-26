import type { Metadata } from 'next';
import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContent } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Origen & Floraciones — La Obrera y el Zángano',
  description: 'Colección de monografías científicas sobre las fuentes florales del bosque nativo chileno.',
};

export default async function OrigenIndexPage() {
  // Aquí idealmente leeríamos del CMS una colección de floraciones.
  // Por ahora, dejamos Ulmo como la primera monografía de la colección.
  
  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-16 min-h-[60vh]">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Colección
        </span>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight text-foreground">
          Origen & Floraciones
        </h1>
        <p className="mt-6 max-w-2xl text-foreground/80 leading-relaxed">
          Explora nuestra biblioteca de monografías botánicas. Un estudio profundo y documentado sobre las especies nectaríferas que sostienen la biodiversidad del bosque valdiviano y dan origen a nuestras creaciones.
        </p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link href="/origen/ulmo" className="group block border border-border p-6 rounded-lg hover:border-accent transition-colors">
            <h2 className="font-display text-2xl font-semibold text-foreground group-hover:text-accent transition-colors">Ulmo</h2>
            <p className="mt-1 text-sm italic text-muted-foreground">Eucryphia cordifolia</p>
            <p className="mt-4 text-sm text-foreground/70 leading-relaxed line-clamp-3">
              Árbol majestuoso del bosque valdiviano, conocido por sus grandes flores blancas y su néctar de alta concentración de azúcares. Produce una miel de aroma floral intenso y notas de vainilla.
            </p>
            <span className="mt-6 inline-block text-xs font-medium uppercase tracking-widest text-accent-text">Leer monografía →</span>
          </Link>
          
          {/* Aquí se iterarían otras floraciones desde el CMS (Tiaca, Tineo, etc.) */}
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
