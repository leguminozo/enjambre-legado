import dynamic from 'next/dynamic';

const MapaLegadoBase = dynamic(
  () => import('./MapaLegadoBase').then((mod) => mod.MapaLegado),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] rounded-lg bg-card border border-border animate-pulse flex flex-col items-center justify-center">
        <div className="text-muted-foreground font-datos text-sm">Cargando mapa territorial...</div>
      </div>
    )
  }
);

interface MapaLegadoProps {
  height?: string;
  filterRole?: string;
}

export function MapaLegado(props: MapaLegadoProps) {
  return <MapaLegadoBase {...props} />;
}
