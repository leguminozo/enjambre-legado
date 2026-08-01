import dynamic from 'next/dynamic';

export type EnvioMapPoint = {
  id: string;
  tracking_code: string;
  destino: string;
  status: string;
  items: string;
  created_at: string | null;
};

const MapaEnviosHistoricoBase = dynamic(
  () => import('./MapaEnviosHistoricoBase').then((mod) => mod.MapaEnviosHistorico),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center rounded-xl border border-border bg-surface-sunken text-sm text-muted-foreground w-full h-full min-h-[240px] animate-pulse">
        Cargando mapa de envíos...
      </div>
    )
  }
);

export function MapaEnviosHistorico({
  envios,
  height = '100%',
  className = '',
}: {
  envios: EnvioMapPoint[];
  height?: string;
  className?: string;
}) {
  return <MapaEnviosHistoricoBase envios={envios} height={height} className={className} />;
}
