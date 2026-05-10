import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';

export const metadata = { title: 'Contacto' };

export default function ContactoPage() {
  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-foreground">Contacto</h1>
        <p className="mt-4 text-muted-foreground">
          Pureo rural km 8560 — Queilen, Chiloé.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Puedes añadir formulario o enlaces. El botón flotante de WhatsApp aparece si defines{' '}
          <code className="rounded bg-secondary px-1 text-foreground/80">NEXT_PUBLIC_WHATSAPP_E164</code> en Vercel
          (solo dígitos, con código país, ej. 56912345678).
        </p>
        <Link href="/" className="mt-8 inline-block text-sm text-accent underline underline-offset-2">
          ← Inicio
        </Link>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
