'use client';

import dynamic from 'next/dynamic';
import { CarritoSkeleton } from '@/components/pos/CarritoSkeleton';

const CarritoView = dynamic(() => import('./carrito-view').then((m) => m.CarritoView), {
  ssr: false,
  loading: () => <CarritoSkeleton />,
});

export default function CarritoPage() {
  return <CarritoView />;
}
