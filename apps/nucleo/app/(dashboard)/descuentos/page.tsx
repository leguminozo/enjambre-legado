import { Metadata } from 'next';
import { DescuentosView } from '@/views/DescuentosView';

export const metadata: Metadata = {
  title: 'Cupones & Descuentos',
};

export default function DescuentosPage() {
  return <DescuentosView />;
}
