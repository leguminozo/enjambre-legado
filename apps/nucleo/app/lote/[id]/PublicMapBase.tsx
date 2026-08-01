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
      className="h-full w-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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
