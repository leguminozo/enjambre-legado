import dynamic from 'next/dynamic';

interface PublicMapProps {
  lat: number;
  lng: number;
}

const PublicMapBase = dynamic(
  () => import('./PublicMapBase').then((mod) => mod.PublicMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-surface-sunken animate-pulse flex items-center justify-center min-h-[300px]">
        <span className="text-muted-foreground text-sm font-datos">Cargando mapa público...</span>
      </div>
    )
  }
);

export function PublicMap(props: PublicMapProps) {
  return <PublicMapBase {...props} />;
}
