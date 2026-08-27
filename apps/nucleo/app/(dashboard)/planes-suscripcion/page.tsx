import { Metadata } from 'next';
import { SubscriptionPlansView } from '@/views/SubscriptionPlansView';

export const metadata: Metadata = {
  title: 'Planes de Suscripción',
};

export default function PlanesSuscripcionPage() {
  return <SubscriptionPlansView />;
}
