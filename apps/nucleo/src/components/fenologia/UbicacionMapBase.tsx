'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { EsriSatelliteTileLayers, fixLeafletDefaultIcons } from '@/components/map/MapLayers';
import { MapResizeWatcher } from '@/components/map/MapResizeWatcher';
import 'leaflet/dist/leaflet.css';

fixLeafletDefaultIcons();

const PIN_ICON = L.divIcon({
  className: 'enj-floracion-pin',
  html: `<div style="
    width: 28px;
    height: 28px;
    background: #d4a34b;
    border: 2.5px solid #ffffff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <span style="transform: rotate(45deg); font-size: 13px;">🌸</span>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function CenterWatcher({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface UbicacionMapBaseProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function UbicacionMapBase({ lat, lng, onChange }: UbicacionMapBaseProps) {
  const defaultCenter: [number, number] = [-42.4, -73.7]; // Chiloé central
  const currentPos: [number, number] = lat != null && lng != null ? [lat, lng] : defaultCenter;

  return (
    <div className="w-full h-72 rounded-xl overflow-hidden border border-border relative z-0">
      <MapContainer
        center={currentPos}
        zoom={lat != null && lng != null ? 14 : 9}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapResizeWatcher />
        <EsriSatelliteTileLayers />
        <MapClickHandler onPick={onChange} />
        {lat != null && lng != null && (
          <>
            <CenterWatcher center={[lat, lng]} />
            <Marker
              position={[lat, lng]}
              icon={PIN_ICON}
              draggable={true}
              eventHandlers={{
                dragend(e) {
                  const marker = e.target as L.Marker;
                  const pos = marker.getLatLng();
                  onChange(pos.lat, pos.lng);
                },
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
