import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mapMarkers, type MapMarker } from '../../data/mockData';
import { timelineEvents } from '../../data/mockData';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createCustomIcon(marker: MapMarker): L.DivIcon {
    let html = '';
    let className = '';

    switch (marker.type) {
        case 'obrera':
            className = 'marker-obrera';
            html = `<div class="marker-obrera-inner health-${marker.health || 'optimal'}">
        <span style="transform:rotate(45deg);font-size:14px;">🐝</span>
      </div>`;
            break;
        case 'zangano':
            className = 'marker-obrera';
            html = `<div class="marker-zangano-inner" title="${marker.name}"></div>`;
            break;
        case 'nectar':
            className = 'marker-obrera';
            html = `<div class="marker-nectar-inner"></div>`;
            break;
        case 'tree':
            className = 'marker-obrera';
            html = `<div class="marker-tree-inner" style="display:flex;align-items:center;justify-content:center;">
        <span style="font-size:14px;">🌳</span>
      </div>`;
            break;
        case 'feria':
            className = 'marker-obrera';
            html = `<div class="marker-zangano-inner" style="background:var(--oro-miel);border-color:var(--bosque-ulmo);">
        <span style="font-size:11px;transform:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">📍</span>
      </div>`;
            break;
        default:
            className = 'marker-obrera';
            html = `<div class="marker-obrera-inner"></div>`;
    }

    return L.divIcon({
        className,
        html,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });
}

function getMarkerTypeLabel(type: string): string {
    switch (type) {
        case 'obrera': return '🐝 Colmena Activa';
        case 'zangano': return '🔭 Punto Estratégico';
        case 'nectar': return '💧 Punto de Venta';
        case 'tree': return '🌳 Bosque Regenerado';
        case 'feria': return '📍 Feria / Evento';
        default: return '';
    }
}

// Component to auto-fit map bounds
function FitBounds({ markers }: { markers: MapMarker[] }) {
    const map = useMap();
    const fitted = useRef(false);

    useEffect(() => {
        if (!fitted.current && markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
            fitted.current = true;
        }
    }, [markers, map]);

    return null;
}

interface MapaLegadoProps {
    height?: string;
    filterRole?: string;
}

export default function MapaLegado({ height = '500px', filterRole }: MapaLegadoProps) {
    // Filter markers based on role if provided
    let filteredMarkers = mapMarkers;
    if (filterRole === 'apicultor') {
        filteredMarkers = mapMarkers.filter(m => m.type === 'obrera' || m.type === 'tree');
    } else if (filterRole === 'vendedor') {
        filteredMarkers = mapMarkers.filter(m => m.type === 'nectar' || m.type === 'feria' || m.type === 'zangano');
    }

    // Chiloé center
    const center: [number, number] = [-42.47, -73.73];

    return (
        <div>
            {/* Map */}
            <div className="map-container" style={{ height }}>
                <MapContainer
                    center={center}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FitBounds markers={filteredMarkers} />
                    {filteredMarkers.map((marker) => (
                        <Marker
                            key={marker.id}
                            position={[marker.lat, marker.lng]}
                            icon={createCustomIcon(marker)}
                        >
                            <Popup>
                                <div style={{ minWidth: 180 }}>
                                    <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 4 }}>
                                        {getMarkerTypeLabel(marker.type)}
                                    </div>
                                    <strong style={{ fontSize: '0.95rem', color: '#0A3D2F' }}>{marker.name}</strong>
                                    {marker.details && (
                                        <p style={{ fontSize: '0.82rem', color: '#555', marginTop: 6, lineHeight: 1.4 }}>
                                            {marker.details}
                                        </p>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Timeline */}
            <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                <div className="section-header">
                    <div>
                        <div className="section-title">Viaje del Legado</div>
                        <div className="section-subtitle">22 años de apicultura regenerativa</div>
                    </div>
                </div>
                <div className="timeline-container">
                    <div className="timeline-track">
                        {timelineEvents.map((evt, i) => (
                            <div key={evt.year} style={{ display: 'flex', alignItems: 'center' }}>
                                <div className={`timeline-node ${evt.active ? 'active' : ''}`}>
                                    <div className="timeline-dot" />
                                    <div className="timeline-year">{evt.year}</div>
                                    <div className="timeline-label">{evt.label}</div>
                                </div>
                                {i < timelineEvents.length - 1 && <div className="timeline-line" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="card" style={{ marginTop: 'var(--space-md)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                            width: 14, height: 14, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
                            background: 'linear-gradient(135deg, #D4A017, #B8890F)', display: 'inline-block', border: '2px solid #2ECC71'
                        }} /> Obrera dorada (colmena)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#0A3D2F', border: '2px solid #D4A017', display: 'inline-block' }} /> Zángano (expansión)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 13, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: '#D4A017', display: 'inline-block', border: '2px solid white' }} /> Gota de néctar (venta)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#2ECC71', border: '2px solid #0A3D2F', display: 'inline-block' }} /> Árbol ulmo (bosque)
                    </span>
                </div>
            </div>
        </div>
    );
}
