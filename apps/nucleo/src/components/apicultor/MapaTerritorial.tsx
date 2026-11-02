import dynamic from 'next/dynamic';
import { Skeleton } from '@enjambre/ui';

const MapaTerritorialBase = dynamic(
  () => import('./MapaTerritorialBase').then((mod) => mod.MapaTerritorial),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 animate-in" aria-busy="true" aria-label="Cargando visor territorial">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-48 h-4" />
          <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
        </div>
        <Skeleton variant="rectangular" className="w-full flex-1 min-h-[420px] rounded-xl" />
      </div>
    ),
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
