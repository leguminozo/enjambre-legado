import { Metadata } from 'next';
import { LazyDescuentosView } from '@/lib/navigation/lazy-views';

export const metadata: Metadata = {
  title: 'Cupones & Descuentos',
};

export default function DescuentosPage() {
  return <LazyDescuentosView />;
}
