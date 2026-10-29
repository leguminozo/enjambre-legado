import dynamic from 'next/dynamic';
import { ViewLoadingFallback } from '@enjambre/ui';
import { getSiteContent } from '@/lib/cms';
import { shippingRatesConfigFromRaw } from '@enjambre/logistica';

const CheckoutClient = dynamic(
  () => import('./ui').then((m) => m.CheckoutClient),
  {
    loading: () => <ViewLoadingFallback label="Pago" context="tienda" />,
  },
);

export const metadata = {
  title: 'Pago Seguro',
};

export default async function CheckoutPage() {
  const shippingRows = await getSiteContent('shipping_settings');
  const shippingRates = shippingRatesConfigFromRaw(
    shippingRows[0]?.content as Record<string, unknown> | undefined,
  );

  return <CheckoutClient shippingRates={shippingRates} />;
}