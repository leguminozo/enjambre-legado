import { Metadata } from 'next';
import { LazyPixelesView } from '@/lib/navigation/lazy-views';

export const metadata: Metadata = {
  title: 'Píxeles & Medición',
};

export default function PixelesPage() {
  return <LazyPixelesView />;
}
