'use client';

import dynamic from 'next/dynamic';

const CarritoView = dynamic(() => import('./carrito-view'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20 gap-3">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-muted-foreground uppercase tracking-widest">Cargando carrito…</span>
    </div>
  ),
});

export default function CarritoPage() {
  return <CarritoView />;
}