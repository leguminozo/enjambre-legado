import { MapaLegado } from '../components/map/MapaLegado';

export function MapaView() {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="section-header animate-in mb-0 pb-0">
        <div>
          <h2>Mapa del Legado</h2>
          <div className="section-subtitle">
            Torre de control territorial, comercial y operativa de Enjambre Legado
          </div>
        </div>
      </div>
      <div className="animate-in delay-1 w-full flex-1">
        <MapaLegado height="calc(100vh - 170px)" />
      </div>
    </div>
  );
}
