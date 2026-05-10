import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';

export const metadata = { title: 'Nosotros' };

export default function NosotrosPage() {
  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-foreground">Nosotros</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Historia del proyecto, el equipo y el territorio. Sustituye este texto por la narrativa oficial de
          obrerayzangano.com cuando la migres.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm text-accent underline underline-offset-2">
          ← Inicio
        </Link>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
