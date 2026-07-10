import { LazyPosFeriaView } from '@/lib/navigation/lazy-views';
import { ViewLoading } from '@enjambre/ui';
import { Suspense } from 'react';

export default function PuntoVentaPage() {
  return (
    <Suspense fallback={<ViewLoading variant="view" label="Cargando Punto de Venta" />}>
      <LazyPosFeriaView />
    </Suspense>
  );
}
