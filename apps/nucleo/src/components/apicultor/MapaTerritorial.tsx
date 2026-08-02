import dynamic from 'next/dynamic';

const MapaTerritorialBase = dynamic(
  () => import('./MapaTerritorialBase').then((mod) => mod.MapaTerritorial),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] bg-card border border-border rounded-lg flex items-center justify-center animate-pulse">
        <div className="text-muted-foreground font-datos text-sm flex items-center gap-2">
          <span>📍</span> Cargando visor territorial...
        </div>
      </div>
    )
  }
);

// Mismos tipos que el base para mantener compatibilidad
interface ActorResumen {
  id: string;
  rol: string;
  nombre_actor: string;
  comuna: string;
  nivel_acreditacion: string;
  estado: string;
}

interface AlertaResumen {
  id: string;
  producto: string;
  zona: string;
  fecha_programada: string;
  estado: string;
  lat_aproximada?: number;
  lng_aproximada?: number;
  radio_km?: number;
}

interface ApiarioExternoResumen {
  id: string;
  lat_aproximada?: number;
  lng_aproximada?: number;
  actores_registro: { nombre_actor: string, rup?: string };
}

interface ApiarioRegistroResumen {
  id: string;
  nombre?: string | null;
  comuna: string;
  zona: string;
  n_colmenas: number;
  categoria: string;
  lat_aproximada?: number | null;
  lng_aproximada?: number | null;
}

interface MapaTerritorialProps {
  actores: ActorResumen[];
  alertas: AlertaResumen[];
  apiariosExternos?: ApiarioExternoResumen[];
  apiariosRegistro?: ApiarioRegistroResumen[];
}

export function MapaTerritorial(props: MapaTerritorialProps) {
  return <MapaTerritorialBase {...props} />;
}
