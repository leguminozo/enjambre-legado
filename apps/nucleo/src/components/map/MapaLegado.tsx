import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import type { Map } from 'leaflet';
import { supabase } from '../../lib/supabase';
import L from 'leaflet';
import { BOSQUE_ULMO, ORO_MIEL, ORO_MIEL_DARK, SALUD_OPTIMA } from '@/lib/colors';
import 'leaflet/dist/leaflet.css';
import { timelineEvents, type MapMarker } from '../../data/mockData';
import { Plus, X, MapPin } from 'lucide-react';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createCustomIcon(marker: MapMarker): L.DivIcon {
  const configs: Record<string, { className: string; html: string }> = {
    obrera: {
      className: 'marker-obrera',
      html: `<div class="marker-obrera-inner health-${marker.health || 'optimal'}">
<span style="transform:rotate(45deg);font-size:14px;">🐝</span>
</div>`,
    },
    zangano: {
      className: 'marker-obrera',
      html: `<div class="marker-zangano-inner" title="${marker.name}"></div>`,
    },
    nectar: {
      className: 'marker-obrera',
      html: `<div class="marker-nectar-inner"></div>`,
    },
    tree: {
      className: 'marker-obrera',
      html: `<div class="marker-tree-inner" style="display:flex;align-items:center;justify-content:center;">
<span style="font-size:14px;">🌳</span>
</div>`,
    },
    feria: {
      className: 'marker-obrera',
      html: `<div class="marker-zangano-inner" style="background:hsl(var(--accent));border-color:hsl(var(--primary));">
<span style="font-size:11px;transform:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">📍</span>
</div>`,
    },
  };

  const { className, html } = configs[marker.type] ?? {
    className: 'marker-obrera',
    html: `<div class="marker-obrera-inner"></div>`,
  };

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

// Component to handle map clicks for adding markers
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

interface MapaLegadoProps {
    height?: string;
    filterRole?: string;
}

export function MapaLegado({ height = '500px', filterRole }: MapaLegadoProps) {
    const [liveMarkers, setLiveMarkers] = useState<MapMarker[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMarkerCoords, setNewMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [newMarkerForm, setNewMarkerForm] = useState({ type: 'obrera' as 'obrera' | 'tree', name: '', details: '' });

    useEffect(() => {
        async function loadMaps() {
            const { data: apiarios } = await supabase.from('apiarios').select('id, name, lat, lng, details');
            const { data: arboles } = await supabase.from('arboles_plantados').select('id, especie, lat, lng').not('lat', 'is', null);
            const markers: MapMarker[] = [];
            apiarios?.forEach((a: Record<string, unknown>) => {
                if (a.lat != null && a.lng != null) {
                    markers.push({
                        id: `api-${String(a.id)}`,
                        lat: Number(a.lat),
                        lng: Number(a.lng),
                        type: 'obrera',
                        name: String(a.name ?? 'Apiario'),
                        details: a.details ? String(a.details) : undefined,
                    });
                }
            });
            arboles?.forEach((t: Record<string, unknown>) => {
                if (t.lat != null && t.lng != null) {
                    markers.push({
                        id: `tree-${String(t.id)}`,
                        lat: Number(t.lat),
                        lng: Number(t.lng),
                        type: 'tree',
                        name: String(t.especie ?? 'Árbol nativo'),
                    });
                }
            });
            setLiveMarkers(markers);
        }
        loadMaps();
    }, []);

    const handleMapClick = (lat: number, lng: number) => {
        if (!isEditMode) return;
        setNewMarkerCoords({ lat, lng });
        setShowAddModal(true);
    };

    const handleSaveMarker = async () => {
        if (!newMarkerCoords || !newMarkerForm.name) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            if (newMarkerForm.type === 'obrera') {
                const { data: newApiario } = await supabase.from('apiarios').insert({
                    name: newMarkerForm.name,
                    lat: newMarkerCoords.lat,
                    lng: newMarkerCoords.lng,
                    details: newMarkerForm.details || null,
                    user_id: user.id,
                }).select().single();

                if (newApiario) {
                    setLiveMarkers(prev => [...prev, {
                        id: `api-${String(newApiario.id)}`,
                        lat: newMarkerCoords.lat,
                        lng: newMarkerCoords.lng,
                        type: 'obrera',
                        name: newMarkerForm.name,
                        details: newMarkerForm.details || undefined,
                    }]);
                }
            } else if (newMarkerForm.type === 'tree') {
                const { data: newArbol } = await supabase.from('arboles_plantados').insert({
                    especie: newMarkerForm.name,
                    lat: newMarkerCoords.lat,
                    lng: newMarkerCoords.lng,
                    user_id: user.id,
                    fecha: new Date().toISOString().split('T')[0],
                }).select().single();

                if (newArbol) {
                    setLiveMarkers(prev => [...prev, {
                        id: `tree-${String(newArbol.id)}`,
                        lat: newMarkerCoords.lat,
                        lng: newMarkerCoords.lng,
                        type: 'tree',
                        name: newMarkerForm.name,
                    }]);
                }
            }

            setShowAddModal(false);
            setNewMarkerForm({ type: 'obrera', name: '', details: '' });
            setNewMarkerCoords(null);
        } catch (error) {
            console.error('Error saving marker:', error);
        }
    };

    // Filter markers based on role if provided
    let filteredMarkers = liveMarkers;
    if (filterRole === 'apicultor') {
        filteredMarkers = liveMarkers.filter(m => m.type === 'obrera' || m.type === 'tree' || m.type === 'zangano');
    } else if (filterRole === 'vendedor') {
        filteredMarkers = liveMarkers.filter(m => m.type === 'nectar' || m.type === 'feria');
    }

    // Chiloé center
    const center: [number, number] = [-42.47, -73.73];

    return (
        <div>
            {/* Map */}
            <div className="map-container" style={{ height }}>
                <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`btn btn-sm ${isEditMode ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ 
                            background: isEditMode ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                            border: `1px solid ${isEditMode ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                            color: isEditMode ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
                        }}
                    >
                        <MapPin size={14} style={{ marginRight: 4 }} />
                        {isEditMode ? 'Modo Edición ON' : 'Modo Edición'}
                    </button>
                </div>
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
                    {isEditMode && <MapClickHandler onMapClick={handleMapClick} />}
                    {filteredMarkers.map((marker) => (
                        <Marker
                            key={marker.id}
                            position={[marker.lat, marker.lng]}
                            icon={createCustomIcon(marker)}
                        >
                            <Popup>
                                <div style={{ minWidth: 180 }}>
                                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>
                                        {getMarkerTypeLabel(marker.type)}
                                    </div>
                                    <strong style={{ fontSize: '0.95rem', color: BOSQUE_ULMO }}>{marker.name}</strong>
                                    {marker.details && (
                                        <p style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', marginTop: 6, lineHeight: 1.4 }}>
                                            {marker.details}
                                        </p>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Add Marker Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'hsl(var(--foreground) / 0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAddModal(false)} />
                    <div className="card" style={{ position: 'relative', zIndex: 2001, width: 400, padding: 'var(--space-xl)' }}>
                        <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}><X size={16} /></button>
                        <div className="section-title" style={{ marginBottom: 'var(--space-md)' }}>
                            Agregar al Mapa
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Tipo</label>
                                <select 
                                    className="input-field" 
                                    value={newMarkerForm.type} 
                                    onChange={e => setNewMarkerForm({ ...newMarkerForm, type: e.target.value as 'obrera' | 'tree' })}
                                >
                                    <option value="obrera">🐝 Apiario</option>
                                    <option value="tree">🌳 Árbol</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Nombre</label>
                                <input 
                                    className="input-field" 
                                    value={newMarkerForm.name} 
                                    onChange={e => setNewMarkerForm({ ...newMarkerForm, name: e.target.value })} 
                                    placeholder={newMarkerForm.type === 'obrera' ? 'Ej. Apiario Norte' : 'Ej. Ulmo'}
                                />
                            </div>
                            {newMarkerForm.type === 'obrera' && (
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Detalles (opcional)</label>
                                    <input 
                                        className="input-field" 
                                        value={newMarkerForm.details} 
                                        onChange={e => setNewMarkerForm({ ...newMarkerForm, details: e.target.value })} 
                                        placeholder="Sector, notas adicionales..."
                                    />
                                </div>
                            )}
                            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
                                Coordenadas: {newMarkerCoords?.lat.toFixed(6)}, {newMarkerCoords?.lng.toFixed(6)}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-xl)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSaveMarker}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}

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
                            background: `linear-gradient(135deg, ${ORO_MIEL}, ${ORO_MIEL_DARK})`, display: 'inline-block', border: `2px solid ${SALUD_OPTIMA}`
                        }} /> Obrera dorada (colmena)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: BOSQUE_ULMO, border: `2px solid ${ORO_MIEL}`, display: 'inline-block' }} /> Zángano (expansión)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 13, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: ORO_MIEL, display: 'inline-block', border: '2px solid hsl(var(--foreground))' }} /> Gota de néctar (venta)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: SALUD_OPTIMA, border: `2px solid ${BOSQUE_ULMO}`, display: 'inline-block' }} /> Árbol ulmo (bosque)
                    </span>
                </div>
            </div>
        </div>
    );
}
