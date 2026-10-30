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
import { MapPin, Navigation } from 'lucide-react';

fixLeafletDefaultIcons();

export type MapaDestinoPreviewProps = {
  destino?: string | null;
  destinatario?: string | null;
  courierLabel?: string | null;
  height?: string;
  className?: string;
};

function destinationMarkerIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;">
        <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(217,119,6,0.35);animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position:relative;width:16px;height:16px;border-radius:50%;background:#D97706;border:2.5px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.6);"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function TargetMapFly({ coords }: { coords: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 12, { duration: 1.2 });
    }
  }, [map, coords]);
  return null;
}

export function MapaDestinoPreview({
  destino,
  destinatario,
  courierLabel,
  height = '100%',
  className = '',
}: MapaDestinoPreviewProps) {
  const coords = useMemo(() => {
    if (!destino || !destino.trim()) return null;
    return resolveClienteCoords(null, destino, destino);
  }, [destino]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-border bg-surface-sunken flex flex-col ${className}`.trim()}
      style={{ height }}
    >
      <div className="flex-1 w-full relative min-h-[200px]">
        <MapContainer
          center={coords ? [coords.lat, coords.lng] : [-42.48, -73.76]}
          zoom={coords ? 12 : 7}
          scrollWheelZoom={false}
          attributionControl={false}
          className="h-full w-full"
          style={{ height: '100%', minHeight: 200 }}
        >
          <EsriSatelliteTileLayers />
          <MapResizeWatcher />
          <TargetMapFly coords={coords} />
          {coords && (
            <Marker position={[coords.lat, coords.lng]} icon={destinationMarkerIcon()}>
              <Popup>
                <div className="text-xs space-y-1 min-w-[10rem]">
                  <div className="font-semibold text-foreground">{destinatario || 'Destinatario'}</div>
                  <div className="text-muted-foreground">{destino}</div>
                  {courierLabel && (
                    <div className="text-accent font-medium text-[11px]">
                      Vía {courierLabel}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Overlay pill informativo */}
        <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none">
          <div className="bg-background/90 backdrop-blur border border-border/80 px-3 py-2 rounded-lg text-xs shadow-lg flex items-center justify-between gap-2">
            {coords ? (
              <div className="flex items-center gap-2 text-foreground truncate">
                <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse shrink-0" />
                <span className="font-medium truncate">{destino}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground truncate">
                <Navigation size={13} className="shrink-0 text-accent/80" />
                <span className="truncate">Ingresa ciudad o comuna para centrar la ruta</span>
              </div>
            )}
            {coords && (
              <span className="text-[10px] text-accent font-medium uppercase tracking-wider shrink-0 bg-accent/15 px-2 py-0.5 rounded border border-accent/30">
                Punto fijado
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
