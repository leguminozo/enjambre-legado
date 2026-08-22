'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icon issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

interface PublicMapProps {
  lat: number;
  lng: number;
}

export function PublicMap({ lat, lng }: PublicMapProps) {
  useEffect(() => {
    // Leaflet init cleanup if needed
  }, []);

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
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={18}
      />
      <TileLayer
        url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        maxZoom={18}
        opacity={0.85}
      />
      
      {/* 
        Capa Pública: Círculo de 3km de radio. 
        Protege las coordenadas exactas mostrando solo el área de pecoreo general.
      */}
      <Circle 
        center={[lat, lng]} 
        pathOptions={{ 
          fillColor: '#FFC107', 
          fillOpacity: 0.3,
          color: '#FFB300',
          weight: 2
        }} 
        radius={3000} 
      />
    </MapContainer>
  );
}
