import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { ImagePlaceholder } from '@/components/shop/image-placeholder';

export const metadata = { title: 'Galería' };

export default function GaleriaPage() {
  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-foreground">Galería</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Rejilla lista para tus fotos del apiario, el bosque y el proceso. Sube imágenes y reemplaza estos
          bloques.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <ImagePlaceholder ratio="square" label={`Foto ${i + 1}`} className="rounded-lg" />
            </li>
          ))}
        </ul>
        <Link href="/" className="mt-10 inline-block text-sm text-accent underline underline-offset-2">
          ← Inicio
        </Link>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
