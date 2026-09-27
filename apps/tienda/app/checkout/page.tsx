import dynamic from 'next/dynamic';
import { ViewLoadingFallback } from '@enjambre/ui';

const CheckoutClient = dynamic(
  () => import('./ui').then((m) => m.CheckoutClient),
  {
    loading: () => <ViewLoadingFallback label="Pago" />,
  },
);

export const metadata = {
  title: 'Pago Seguro',
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}