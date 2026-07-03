import dynamic from 'next/dynamic';
import { ViewLoadingFallback } from '@enjambre/ui';

const CheckoutClient = dynamic(
  () => import('./ui').then((m) => m.CheckoutClient),
  {
    loading: () => <ViewLoadingFallback label="Checkout" />,
  },
);

export const metadata = {
  title: 'Checkout',
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}