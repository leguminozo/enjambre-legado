import MapaLegado from '../components/map/MapaLegado';

interface MapaViewProps {
    currentRole: string;
}

export default function MapaView({ currentRole }: MapaViewProps) {
    return (
        <div>
            <div className="section-header animate-in">
                <div>
                    <h2>Mapa del Legado</h2>
                    <div className="section-subtitle">
                        22 años de apicultura regenerativa en el archipiélago de Chiloé
                    </div>
                </div>
            </div>
            <div className="animate-in delay-1">
                <MapaLegado height="550px" filterRole={currentRole} />
            </div>
        </div>
    );
}
