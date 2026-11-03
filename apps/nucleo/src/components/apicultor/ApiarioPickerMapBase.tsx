'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import type L from 'leaflet';
import {
  EsriSatelliteTileLayers,
  createMapBadgeIcon,
  fixLeafletDefaultIcons,
} from '@/components/map/MapLayers';
import { MapResizeWatcher } from '@/components/map/MapResizeWatcher';
import { resolveComunaCoords } from '@/lib/cliente-coords';
import 'leaflet/dist/leaflet.css';

fixLeafletDefaultIcons();

const APIARIO_PIN_ICON = createMapBadgeIcon('hsl(44 88% 48%)', '🐝', 32);

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

function FlyToWatcher({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);

  useEffect(() => {
    const [prevLat, prevLng] = prevCenterRef.current;
    const [nextLat, nextLng] = center;
    const dist = Math.hypot(prevLat - nextLat, prevLng - nextLng);

    // Si hubo un cambio real de posición
    if (dist > 0.0001) {
      prevCenterRef.current = center;
      map.flyTo(center, Math.max(map.getZoom(), zoom), { duration: 1 });
    }
  }, [center, zoom, map]);

  return null;
}

export interface ApiarioPickerMapBaseProps {
  lat: number | null;
  lng: number | null;
  comuna?: string | null;
  onChange: (lat: number, lng: number) => void;
}

export default function ApiarioPickerMapBase({
  lat,
  lng,
  comuna,
  onChange,
}: ApiarioPickerMapBaseProps) {
  // Centro por defecto según comuna o centro del archipiélago de Chiloé
  const comunaCoords = useMemo(() => resolveComunaCoords(comuna), [comuna]);
  const defaultCenter: [number, number] = comunaCoords
    ? [comunaCoords.lat, comunaCoords.lng]
    : [-42.48, -73.76];

  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng);
  const activeCenter: [number, number] = hasCoords ? [lat, lng] : defaultCenter;
  const initialZoom = hasCoords ? 14 : comunaCoords ? 12 : 9;

  return (
    <div className="w-full h-72 sm:h-80 lg:h-[380px] xl:h-[420px] rounded-xl overflow-hidden border border-border relative z-0 shadow-inner">
      <MapContainer
        center={activeCenter}
        zoom={initialZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapResizeWatcher />
        <EsriSatelliteTileLayers />
        <MapClickHandler onPick={onChange} />
        <FlyToWatcher center={activeCenter} zoom={hasCoords ? 14 : 12} />

        {hasCoords && (
          <Marker
            position={[lat, lng]}
            icon={APIARIO_PIN_ICON}
            draggable={true}
            eventHandlers={{
              dragend(e) {
                const marker = e.target as L.Marker;
                const pos = marker.getLatLng();
                onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
              },
            }}
          />
        )}
      </MapContainer>

      {/* Guía visual sobre el mapa */}
      <div className="absolute top-2 right-2 z-[400] pointer-events-none bg-background/85 backdrop-blur-sm border border-border/70 rounded-md px-2.5 py-1 text-[0.68rem] text-muted-foreground shadow-sm flex items-center gap-1.5">
        <span>🐝</span>
        <span>Haz click en el mapa o arrastra el pin</span>
      </div>
    </div>
  );
}
