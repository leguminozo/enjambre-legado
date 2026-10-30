'use client';

import dynamic from 'next/dynamic';
import { Map } from 'lucide-react';
import { Skeleton } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useLogisticaDashboard } from '@/components/logistica/use-logistica-dashboard';

const MapaEnviosHistorico = dynamic(
  () =>
    import('@/components/logistica/MapaEnviosHistorico').then((mod) => mod.MapaEnviosHistorico),
  { ssr: false, loading: () => <Skeleton variant="rectangular" className="w-full h-[560px] rounded-xl" /> },
);

export function MapaEnviosView() {
  const { dashboard, isLoading } = useLogisticaDashboard();

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Despacho"
        title="Mapa de envíos"
        subtitle="Historial geográfico de todos los envíos registrados."
        icon={<Map size={20} />}
      />

      <div className="card p-4">
        {isLoading ? (
          <Skeleton variant="rectangular" className="w-full h-[560px] rounded-xl" />
        ) : (
          <MapaEnviosHistorico envios={dashboard.envios} height="min(70vh, 560px)" />
        )}
        <p className="text-xs text-muted-foreground mt-3">
          {dashboard.envios.length} envío(s) en el historial
        </p>
      </div>
    </div>
  );
}
