import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';

export const metadata = { title: 'Experiencias' };

export default function ExperienciasPage() {
  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-foreground">Experiencias</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Contenido de visitas, ferias y encuentros con el bosque. Lo completaremos con fotos y relatos
          cuando integres el material final.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm text-accent underline underline-offset-2">
          ← Inicio
        </Link>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
