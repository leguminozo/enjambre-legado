import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { ViewLoadingFallback } from '@enjambre/ui';
import { getSiteContent } from '@/lib/cms';
import { shippingRatesConfigFromRaw } from '@enjambre/logistica';

const CarritoClient = dynamic(
  () => import('./ui').then((m) => m.CarritoClient),
  {
    loading: () => <ViewLoadingFallback label="Carrito" />,
  },
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Tu carrito',
  description: 'Revisa tu bolsa antes de finalizar la compra — La Obrera y el Zángano.',
  alternates: { canonical: `${SITE_URL}/carrito` },
  robots: { index: false, follow: true },
};

export default async function CarritoPage() {
  // Tarifas del Editor de Tienda (shipping_settings); sin sección cae a los
  // valores base y el preview del carrito nunca muestra un flete distinto al cobro.
  const shippingRows = await getSiteContent('shipping_settings');
  const shippingRates = shippingRatesConfigFromRaw(
    shippingRows[0]?.content as Record<string, unknown> | undefined,
  );

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[50vh] bg-background">
        <CarritoClient shippingRates={shippingRates} />
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
