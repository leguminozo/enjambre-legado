'use client';

import dynamic from 'next/dynamic';
import type { MapaDestinoPreviewProps } from './MapaDestinoPreviewBase';

const MapaDestinoPreviewBase = dynamic(
  () => import('./MapaDestinoPreviewBase').then((mod) => mod.MapaDestinoPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center rounded-xl border border-border bg-surface-sunken text-xs text-muted-foreground w-full h-full min-h-[200px] animate-pulse">
        Cargando mapa de ruta...
      </div>
    ),
  },
);

export function MapaDestinoPreview(props: MapaDestinoPreviewProps) {
  return <MapaDestinoPreviewBase {...props} />;
}
