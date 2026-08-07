'use client';

import { usePathname } from 'next/navigation';
import { ViewLoading, BrandWordmark } from '@enjambre/ui';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Cargando el punto de venta',
  '/pos': 'Cargando punto de venta',
  '/pos/carrito': 'Cargando carrito',
  '/pos/catalogo': 'Abriendo catálogo',
  '/pos/historial': 'Cargando historial',
  '/caja': 'Abriendo la caja',
  '/comisiones': 'Cargando comisiones',
  '/leaderboard': 'Cargando ranking',
  '/mi-feria': 'Cargando tu feria',
};

export default function CampoLoading() {
  const pathname = usePathname();

  return (
    <ViewLoading
      variant="page"
      label={ROUTE_LABELS[pathname] ?? 'Cargando'}
      context="campo"
      brand={<BrandWordmark name="Enjambre" tagline="Punto de venta" />}
    />
  );
}
