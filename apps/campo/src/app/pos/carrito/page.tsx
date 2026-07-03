'use client';

import dynamic from 'next/dynamic';
import { ViewLoadingFallback } from '@enjambre/ui';

const CarritoView = dynamic(() => import('./carrito-view'), {
  ssr: false,
  loading: () => <ViewLoadingFallback label="Carrito" />,
});

export default function CarritoPage() {
  return <CarritoView />;
}