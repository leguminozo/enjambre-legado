import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { ViewLoadingFallback } from '@enjambre/ui';

const CarritoClient = dynamic(
  () => import('./ui').then((m) => m.CarritoClient),
  {
    loading: () => <ViewLoadingFallback label="Carrito" />,
  },
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

export const metadata: Metadata = {
  title: 'Tu carrito',
  description: 'Revisa tu bolsa antes de finalizar la compra — La Obrera y el Zángano.',
  alternates: { canonical: `${SITE_URL}/carrito` },
  robots: { index: false, follow: true },
};

export default function CarritoPage() {
  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[50vh] bg-background">
        <CarritoClient />
      </main>
      <ShopFooter />
    </StoreShell>
  );
}