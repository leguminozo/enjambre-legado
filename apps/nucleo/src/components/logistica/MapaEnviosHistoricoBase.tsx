'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { resolveClienteCoords } from '@/lib/cliente-coords';
import { MapResizeWatcher } from '@/components/map/MapResizeWatcher';
import {
  EsriSatelliteTileLayers,
  fixLeafletDefaultIcons,
} from '@/components/map/MapLayers';

export type EnvioMapPoint = {
  id: string;
  tracking_code: string;
  destino: string;
  status: string;
  items: string;
  created_at: string | null;
};

fixLeafletDefaultIcons();

const STATUS_COLOR: Record<string, string> = {
  Entregado: 'hsl(var(--success))',
  entregado: 'hsl(var(--success))',
  'En tránsito': 'hsl(var(--info))',
  en_transito: 'hsl(var(--info))',
  Empacando: 'hsl(var(--warning))',
  empacando: 'hsl(var(--warning))',
  Programado: 'hsl(var(--chart-4))',
  pendiente: 'hsl(var(--chart-4))',
};

function markerIcon(status: string) {
  const color = STATUS_COLOR[status] ?? 'hsl(var(--muted-foreground))';
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 8);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 10 });
  }, [map, points]);
  return null;
}

export function MapaEnviosHistorico({
  envios,
  height = '100%',
  className = '',
}: {
  envios: EnvioMapPoint[];
  height?: string;
  className?: string;
}) {
  const plotted = useMemo(() => {
    const seen = new Map<string, { lat: number; lng: number; jitter: number }>();
    return envios
      .map((envio) => {
        const coords = resolveClienteCoords(null, envio.destino, envio.destino);
        if (!coords) return null;
        const key = `${coords.lat.toFixed(2)}-${coords.lng.toFixed(2)}`;
        const base = seen.get(key) ?? { ...coords, jitter: 0 };
        const jitter = base.jitter + 1;
        seen.set(key, { ...base, jitter });
        return {
          envio,
          lat: coords.lat + jitter * 0.012,
          lng: coords.lng + jitter * 0.008,
        };
      })
      .filter(Boolean) as Array<{ envio: EnvioMapPoint; lat: number; lng: number }>;
  }, [envios]);

  if (plotted.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-border bg-surface-sunken text-sm text-muted-foreground ${className}`.trim()}
        style={{ height }}
      >
        Sin coordenadas históricas — agrega ciudad en destino
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border border-border ${className}`.trim()} style={{ height }}>
      <MapContainer
        center={[-42.48, -73.76]}
        zoom={7}
        scrollWheelZoom
        attributionControl={false}
        className="h-full w-full"
        style={{ height: '100%', minHeight: 240 }}
      >
        <EsriSatelliteTileLayers />
        <MapResizeWatcher />
        <FitBounds points={plotted.map((p) => ({ lat: p.lat, lng: p.lng }))} />
        {plotted.map(({ envio, lat, lng }) => (
          <Marker key={envio.id} position={[lat, lng]} icon={markerIcon(envio.status)}>
            <Popup>
              <div className="text-xs space-y-1 min-w-[10rem]">
                <div className="font-semibold">{envio.destino}</div>
                <div className="text-muted-foreground">{envio.tracking_code}</div>
                <div>{envio.items}</div>
                <div className="uppercase tracking-wide text-[10px]">{envio.status}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}