import { CheckoutClient } from './ui';
import { getSiteContent } from '@/lib/cms';
import { shippingRatesConfigFromRaw } from '@enjambre/logistica';

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