'use client';

import dynamic from 'next/dynamic';
import type { MapaChiloePublico as MapaData } from '@/lib/mapa-chiloe-publico';

const Base = dynamic(
  () => import('./MapaChiloePublicoBase').then((m) => m.MapaChiloePublicoBase),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full bg-surface-sunken animate-pulse flex items-center justify-center text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  },
);

export function MapaChiloePublico(props: {
  data: MapaData;
  showApiarios: boolean;
  showAlertas: boolean;
  showFloraciones: boolean;
}) {
  return <Base {...props} />;
}
