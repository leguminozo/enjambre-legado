'use client';

import { MapContainer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  EsriSatelliteTileLayers,
  fixLeafletDefaultIcons,
} from '@/components/map/MapLayers';

fixLeafletDefaultIcons();

interface PublicMapProps {
  lat: number;
  lng: number;
}

export function PublicMap({ lat, lng }: PublicMapProps) {
  return (
    <MapContainer 
      center={[lat, lng]} 
      zoom={11} 
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full z-0"
    >
      <EsriSatelliteTileLayers />
      
      {/* 
        Capa Pública: Círculo de 3km de radio. 
        Protege las coordenadas exactas mostrando solo el área de pecoreo general.
      */}
      <Circle 
        center={[lat, lng]} 
        pathOptions={{ 
          fillColor: 'hsl(44, 85%, 46%)', 
          fillOpacity: 0.25,
          color: 'hsl(44, 85%, 40%)',
          weight: 2
        }} 
        radius={3000} 
      />
    </MapContainer>
  );
}
