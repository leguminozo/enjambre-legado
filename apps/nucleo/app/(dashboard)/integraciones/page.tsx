import { Metadata } from 'next';
import { LazyIntegracionesView } from '@/lib/navigation/lazy-views';

export const metadata: Metadata = {
  title: 'Integraciones',
};

export default function IntegracionesPage() {
  return <LazyIntegracionesView />;
}
