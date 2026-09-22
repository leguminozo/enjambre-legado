import { Metadata } from 'next';
import { LazySubscriptionPlansView } from '@/lib/navigation/lazy-views';

export const metadata: Metadata = {
  title: 'Planes de Suscripción',
};

export default function PlanesSuscripcionPage() {
  return <LazySubscriptionPlansView />;
}
