import { LazyFeriaMonitorView } from '@/lib/navigation/lazy-views';
import { ViewLoading } from '@enjambre/ui';
import { Suspense } from 'react';

export default function MonitorFeriaPage() {
  return (
    <Suspense fallback={<ViewLoading variant="view" label="Cargando Monitor de Feria" />}>
      <LazyFeriaMonitorView />
    </Suspense>
  );
}
