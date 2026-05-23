'use client';

import dynamic from 'next/dynamic';

const MapaView = dynamic(() => import('@/views/MapaView'), { ssr: false });

export default function MapaPage() {
  return <MapaView />;
}
