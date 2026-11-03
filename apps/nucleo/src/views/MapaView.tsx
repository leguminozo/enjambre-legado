import { MapaLegado } from '../components/map/MapaLegado';
import { ViewShell } from '@/components/layout/ViewShell';

export function MapaView() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <ViewShell
        variant="clean"
        title="Mapa del Legado"
        subtitle="Torre de control territorial, comercial y operativa de Enjambre Legado."
      />
      <div className="animate-in delay-1 w-full flex-1">
        <MapaLegado height="calc(100vh - 170px)" />
      </div>
    </div>
  );
}
