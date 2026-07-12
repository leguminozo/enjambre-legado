import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import type { Map } from 'leaflet';
import { supabase } from '../../lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import L from 'leaflet';
import { BOSQUE_ULMO, ORO_MIEL, ORO_MIEL_DARK, SALUD_OPTIMA } from '@/lib/colors';
import 'leaflet/dist/leaflet.css';
import { Plus, X, MapPin } from 'lucide-react';
import { toast, friendlyError, DatePicker } from '@enjambre/ui';
import { resolveClienteCoords } from '@/lib/cliente-coords';

export interface MapMarker {
    id: string;
    type: 'obrera' | 'zangano' | 'nectar' | 'tree' | 'feria' | 'transito' | 'alta_produccion';
    name: string;
    lat: number;
    lng: number;
    health?: 'optimal' | 'attention' | 'risk';
    details?: string;
    alzas?: number;
}

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
    transito: {
      className: 'marker-obrera',
      html: `<div class="marker-nectar-inner" style="background:hsl(var(--info, var(--primary)));border-color:hsl(var(--info-foreground, var(--primary-foreground)));display:flex;align-items:center;justify-content:center;">
<span style="font-size:12px;transform:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">📦</span>
</div>`,
    },
    alta_produccion: {
      className: 'marker-obrera',
      html: `<div class="marker-obrera-inner health-optimal" style="box-shadow: 0 0 15px 5px hsl(var(--accent) / 0.8); transform: scale(1.2);">
<span style="rotate:45deg;font-size:14px;">🌟</span>
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
        case 'transito': return '📦 En Tránsito';
        case 'alta_produccion': return '🌟 Alta Producción';
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

interface Evento {
  id: string;
  nombre: string | null;
  fecha_inicio: string | null;
}

export function MapaLegado({ height = '500px', filterRole }: MapaLegadoProps) {
    const apiFetch = useApiFetch();
    const [liveMarkers, setLiveMarkers] = useState<MapMarker[]>([]);
    const [events, setEvents] = useState<Evento[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMarkerCoords, setNewMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [newMarkerForm, setNewMarkerForm] = useState({ type: 'obrera' as 'obrera' | 'tree', name: '', details: '' });

    // Edit marker states
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editMarkerForm, setEditMarkerForm] = useState({ name: '', details: '', type: 'obrera' as 'obrera' | 'tree' });

    // Timeline event states
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [newEventForm, setNewEventForm] = useState({ nombre: '', fecha_inicio: new Date().toISOString().split('T')[0] });

    // Filter toggles
    const [showApiarios, setShowApiarios] = useState(true);
    const [showTrees, setShowTrees] = useState(true);
    const [showTransito, setShowTransito] = useState(true);
    const [showAltaProduccion, setShowAltaProduccion] = useState(true);

    useEffect(() => {
        async function loadMaps() {
            try {
                const { data: apiarios } = await supabase.from('apiarios').select('id, name, lat, lng, details');
                const arbolesRes = await apiFetch('/api/produccion/arboles/map');
                const arbolesJson = arbolesRes.ok ? await arbolesRes.json() : { data: [] };
                const arboles = arbolesJson.data ?? [];
                const { data: evts } = await supabase
                    .from('eventos')
                    .select('id, nombre, fecha_inicio, lat, lng')
                    .order('fecha_inicio', { ascending: true });
                const { data: clientesRetail } = await supabase
                    .from('clientes')
                    .select('id, name, type, status, total_spent, notes')
                    .in('type', ['B2B', 'Retail', 'Gourmet', 'Exportación'])
                    .in('status', ['activo', 'frecuente']);
                const { data: ventasTransito } = await supabase
                    .from('ventas')
                    .select('id, direccion_envio, productos')
                    .in('estado', ['en_transito', 'En tránsito']);
                const { data: colmenas } = await supabase
                    .from('colmenas')
                    .select('id, apiario_id, alzas')
                    .gte('alzas', 2);

                setEvents(evts ?? []);

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
                arboles.forEach((t: Record<string, unknown>) => {
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
                evts?.forEach((e: Record<string, unknown>) => {
                    if (e.lat != null && e.lng != null) {
                        markers.push({
                            id: `feria-${String(e.id)}`,
                            lat: Number(e.lat),
                            lng: Number(e.lng),
                            type: 'feria',
                            name: String(e.nombre ?? 'Feria / Evento'),
                            details: e.fecha_inicio ? String(e.fecha_inicio) : undefined,
                        });
                    }
                });
                clientesRetail?.forEach((cl: Record<string, unknown>) => {
                    const coords = resolveClienteCoords(
                        cl.notes ? String(cl.notes) : null,
                        cl.direccion ? String(cl.direccion) : null,
                        cl.empresa ? String(cl.empresa) : null,
                    );
                    if (!coords) return;
                    const spent = Number(cl.total_spent) || 0;
                    markers.push({
                        id: `nectar-${String(cl.id)}`,
                        lat: coords.lat,
                        lng: coords.lng,
                        type: 'nectar',
                        name: String(cl.name ?? 'Punto de venta'),
                        details: spent > 0 ? `Cliente activo · $${Math.round(spent).toLocaleString('es-CL')}` : 'Punto de venta',
                    });
                });

                // 📦 En Tránsito
                ventasTransito?.forEach((v: Record<string, unknown>) => {
                    if (v.direccion_envio) {
                        const dirObj = typeof v.direccion_envio === 'string' ? JSON.parse(v.direccion_envio) : v.direccion_envio;
                        const region = dirObj?.region || '';
                        const ciudad = dirObj?.ciudad || dirObj?.comuna || '';
                        
                        const coords = resolveClienteCoords(region, ciudad, '');
                        if (coords) {
                            // Add a little randomness so they don't stack perfectly
                            const jitterLat = (Math.random() - 0.5) * 0.02;
                            const jitterLng = (Math.random() - 0.5) * 0.02;
                            markers.push({
                                id: `transito-${String(v.id)}`,
                                lat: coords.lat + jitterLat,
                                lng: coords.lng + jitterLng,
                                type: 'transito',
                                name: `Pedido en ruta (${ciudad})`,
                                details: 'En camino al destino',
                            });
                        }
                    }
                });

                // 🌟 Alta Producción
                const apiariosAltaProd = new Set<string>();
                colmenas?.forEach((c: Record<string, unknown>) => {
                    if (c.apiario_id) {
                        apiariosAltaProd.add(String(c.apiario_id));
                    }
                });
                
                // Modificamos los marcadores de apiarios que tienen colmenas de alta producción
                markers.forEach(m => {
                    if (m.type === 'obrera' && m.id.startsWith('api-')) {
                        const originalId = m.id.substring(4);
                        if (apiariosAltaProd.has(originalId)) {
                            m.type = 'alta_produccion';
                            m.details = m.details ? `${m.details} | Contiene Súper-Colmenas (+2 alzas)` : 'Contiene Súper-Colmenas (+2 alzas)';
                        }
                    }
                });

                setLiveMarkers(markers);
            } catch (err) {
                toast(friendlyError(err, 'Error al cargar datos del mapa'), { type: 'error' });
            }
        }
        loadMaps();
    }, [apiFetch]);

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
                const res = await apiFetch('/api/produccion/arboles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        especie: newMarkerForm.name,
                        cantidad: 1,
                        sector: 'Mapa legado',
                        lat: newMarkerCoords.lat,
                        lng: newMarkerCoords.lng,
                    }),
                });
                if (!res.ok) throw new Error('No se pudo registrar el árbol');
                const json = await res.json();
                const newArbol = json.data;
                if (newArbol?.id) {
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
            toast(friendlyError(error, 'Error al guardar marcador'), { type: 'error' });
        }
    };

    const handleMoveMarker = async (id: string, lat: number, lng: number) => {
        try {
            if (id.startsWith('api-')) {
                const apiId = id.substring(4);
                const { error } = await supabase.from('apiarios').update({ lat, lng }).eq('id', apiId);
                if (error) throw error;
            } else if (id.startsWith('tree-')) {
                const treeId = id.substring(5);
                const res = await apiFetch(`/api/produccion/arboles/${treeId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat, lng }),
                });
                if (!res.ok) throw new Error('No se pudo mover el árbol');
            }
            toast('Ubicación del marcador actualizada', { type: 'success' });
            setLiveMarkers(prev => prev.map(m => m.id === id ? { ...m, lat, lng } : m));
        } catch (error) {
            toast(friendlyError(error, 'Error al mover marcador'), { type: 'error' });
        }
    };

    const handleDeleteMarker = async (id: string) => {
        try {
            if (id.startsWith('api-')) {
                const apiId = id.substring(4);
                const { error } = await supabase.from('apiarios').delete().eq('id', apiId);
                if (error) throw error;
            } else if (id.startsWith('tree-')) {
                const treeId = id.substring(5);
                const res = await apiFetch(`/api/produccion/arboles/${treeId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('No se pudo eliminar el árbol');
            }
            toast('Marcador eliminado correctamente', { type: 'success' });
            setLiveMarkers(prev => prev.filter(m => m.id !== id));
            setShowEditModal(false);
            setSelectedMarker(null);
        } catch (error) {
            toast(friendlyError(error, 'Error al eliminar marcador'), { type: 'error' });
        }
    };

    const handleUpdateMarker = async () => {
        if (!selectedMarker || !editMarkerForm.name) return;

        try {
            if (selectedMarker.id.startsWith('api-')) {
                const apiId = selectedMarker.id.substring(4);
                const { error } = await supabase.from('apiarios').update({
                    name: editMarkerForm.name,
                    details: editMarkerForm.details || null
                }).eq('id', apiId);
                if (error) throw error;
            } else if (selectedMarker.id.startsWith('tree-')) {
                const treeId = selectedMarker.id.substring(5);
                const res = await apiFetch(`/api/produccion/arboles/${treeId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ especie: editMarkerForm.name }),
                });
                if (!res.ok) throw new Error('No se pudo actualizar el árbol');
            }
            toast('Marcador actualizado correctamente', { type: 'success' });
            setLiveMarkers(prev => prev.map(m => m.id === selectedMarker.id ? { 
                ...m, 
                name: editMarkerForm.name, 
                details: editMarkerForm.details || undefined 
            } : m));
            setShowEditModal(false);
            setSelectedMarker(null);
        } catch (error) {
            toast(friendlyError(error, 'Error al actualizar marcador'), { type: 'error' });
        }
    };

    const handleSaveEvent = async () => {
        if (!newEventForm.nombre || !newEventForm.fecha_inicio) return;
        try {
            const { data: newEvt, error } = await supabase.from('eventos').insert({
                nombre: newEventForm.nombre,
                fecha_inicio: newEventForm.fecha_inicio
            }).select().single();
            if (error) throw error;
            if (newEvt) {
                setEvents(prev => [...prev, newEvt].sort((a, b) => {
                    const dateA = a.fecha_inicio ? new Date(a.fecha_inicio).getTime() : 0;
                    const dateB = b.fecha_inicio ? new Date(b.fecha_inicio).getTime() : 0;
                    return dateA - dateB;
                }));
            }
            toast('Hito agregado exitosamente', { type: 'success' });
            setShowAddEventModal(false);
            setNewEventForm({ nombre: '', fecha_inicio: new Date().toISOString().split('T')[0] });
        } catch (error) {
            toast(friendlyError(error, 'Error al guardar hito'), { type: 'error' });
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        try {
            const { error } = await supabase.from('eventos').delete().eq('id', eventId);
            if (error) throw error;
            setEvents(prev => prev.filter(e => e.id !== eventId));
            toast('Hito eliminado correctamente', { type: 'success' });
        } catch (error) {
            toast(friendlyError(error, 'Error al eliminar hito'), { type: 'error' });
        }
    };

    // Filter markers based on role and user toggles
    let filteredMarkers = liveMarkers.map(m => ({...m})); // clone to allow mutation
    if (filterRole === 'apicultor') {
        filteredMarkers = filteredMarkers.filter(m => m.type === 'obrera' || m.type === 'tree' || m.type === 'zangano' || m.type === 'alta_produccion');
    } else if (filterRole === 'vendedor') {
        filteredMarkers = filteredMarkers.filter(m => m.type === 'nectar' || m.type === 'feria' || m.type === 'transito');
    }
    if (!showApiarios) {
        filteredMarkers = filteredMarkers.filter(m => m.type !== 'obrera' && m.type !== 'alta_produccion');
    } else if (!showAltaProduccion) {
        filteredMarkers.forEach(m => {
            if (m.type === 'alta_produccion') m.type = 'obrera';
        });
    }
    if (!showTrees) {
        filteredMarkers = filteredMarkers.filter(m => m.type !== 'tree');
    }
    if (!showTransito) {
        filteredMarkers = filteredMarkers.filter(m => m.type !== 'transito');
    }

    // Chiloé center
    const center: [number, number] = [-42.47, -73.73];

    return (
        <div>
            {/* Map */}
            <div className="map-container" style={{ height }}>
                <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Layer Toggles */}
                    <div style={{ display: 'flex', gap: 4, background: 'hsl(var(--card) / 0.8)', border: '1px solid hsl(var(--border) / 0.5)', borderRadius: 'var(--radius-md)', padding: 4, backdropFilter: 'blur(8px)' }}>
                        <button
                            onClick={() => setShowApiarios(!showApiarios)}
                            className={`btn btn-sm ${showApiarios ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                padding: '4px 10px', 
                                fontSize: '0.72rem',
                                background: showApiarios ? 'hsl(var(--primary))' : 'transparent',
                                color: showApiarios ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
                            }}
                        >
                            🐝 Apiarios
                        </button>
                        <button
                            onClick={() => setShowTrees(!showTrees)}
                            className={`btn btn-sm ${showTrees ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                padding: '4px 10px', 
                                fontSize: '0.72rem',
                                background: showTrees ? 'hsl(var(--primary))' : 'transparent',
                                color: showTrees ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
                            }}
                        >
                            🌳 Árboles
                        </button>
                        <button
                            onClick={() => setShowTransito(!showTransito)}
                            className={`btn btn-sm ${showTransito ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                padding: '4px 10px', 
                                fontSize: '0.72rem',
                                background: showTransito ? 'hsl(var(--info, var(--primary)))' : 'transparent',
                                color: showTransito ? 'hsl(var(--info-foreground, var(--primary-foreground)))' : 'hsl(var(--foreground))'
                            }}
                        >
                            📦 En Tránsito
                        </button>
                        <button
                            onClick={() => setShowAltaProduccion(!showAltaProduccion)}
                            className={`btn btn-sm ${showAltaProduccion ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                padding: '4px 10px', 
                                fontSize: '0.72rem',
                                background: showAltaProduccion ? 'hsl(var(--accent))' : 'transparent',
                                color: showAltaProduccion ? 'hsl(var(--accent-foreground, var(--primary-foreground)))' : 'hsl(var(--foreground))'
                            }}
                        >
                            🌟 Alta Producción
                        </button>
                    </div>

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
                            draggable={isEditMode}
                            eventHandlers={{
                                dragend: async (e) => {
                                    const markerEvent = e.target;
                                    const position = markerEvent.getLatLng();
                                    await handleMoveMarker(marker.id, position.lat, position.lng);
                                }
                            }}
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

                                    {isEditMode && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 10, borderTop: '1px solid hsl(var(--border) / 0.5)', paddingTop: 8 }}>
                                            <button 
                                                className="btn btn-ghost btn-sm" 
                                                style={{ fontSize: '0.7rem', padding: '2px 8px', color: 'hsl(var(--accent))' }}
                                                onClick={() => {
                                                    setSelectedMarker(marker);
                                                    setEditMarkerForm({
                                                        name: marker.name,
                                                        details: marker.details || '',
                                                        type: marker.type as 'obrera' | 'tree'
                                                    });
                                                    setShowEditModal(true);
                                                }}
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                className="btn btn-ghost btn-sm" 
                                                style={{ fontSize: '0.7rem', padding: '2px 8px', color: 'hsl(var(--destructive))' }}
                                                onClick={() => {
                                                    if (confirm(`¿Está seguro que desea eliminar "${marker.name}"?`)) {
                                                        handleDeleteMarker(marker.id);
                                                    }
                                                }}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
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

            {/* Edit Marker Modal */}
            {showEditModal && selectedMarker && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'hsl(var(--foreground) / 0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowEditModal(false)} />
                    <div className="card" style={{ position: 'relative', zIndex: 2001, width: 400, padding: 'var(--space-xl)' }}>
                        <button onClick={() => setShowEditModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}><X size={16} /></button>
                        <div className="section-title" style={{ marginBottom: 'var(--space-md)' }}>
                            Editar Marcador
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Tipo</label>
                                <div style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                                    {selectedMarker.type === 'obrera' ? '🐝 Apiario' : '🌳 Árbol'}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Nombre</label>
                                <input 
                                    className="input-field" 
                                    value={editMarkerForm.name} 
                                    onChange={e => setEditMarkerForm({ ...editMarkerForm, name: e.target.value })} 
                                    placeholder={selectedMarker.type === 'obrera' ? 'Ej. Apiario Norte' : 'Ej. Ulmo'}
                                />
                            </div>
                            {selectedMarker.type === 'obrera' && (
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Detalles (opcional)</label>
                                    <input 
                                        className="input-field" 
                                        value={editMarkerForm.details} 
                                        onChange={e => setEditMarkerForm({ ...editMarkerForm, details: e.target.value })} 
                                        placeholder="Sector, notas adicionales..."
                                    />
                                </div>
                            )}
                            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
                                Coordenadas: {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-xl)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancelar</button>
                            <button 
                                className="btn btn-ghost" 
                                style={{ color: 'hsl(var(--destructive))', marginRight: 'auto' }}
                                onClick={() => {
                                    if (confirm(`¿Está seguro que desea eliminar "${selectedMarker.name}"?`)) {
                                        handleDeleteMarker(selectedMarker.id);
                                    }
                                }}
                            >
                                Eliminar
                            </button>
                            <button className="btn btn-primary" onClick={handleUpdateMarker}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div className="section-title">Viaje del Legado</div>
                        <div className="section-subtitle">Hitos y eventos en el territorio</div>
                    </div>
                    {isEditMode && (
                        <button 
                            className="btn btn-gold btn-sm"
                            onClick={() => setShowAddEventModal(true)}
                        >
                            <Plus size={13} style={{ marginRight: 4 }} /> Agregar Hito
                        </button>
                    )}
                </div>
                <div className="timeline-container">
                    {events.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.82rem', padding: '16px 0' }}>
                            No hay eventos registrados en la bitácora del territorio.
                        </div>
                    ) : (
                        <div className="timeline-track">
                            {events.map((evt, i) => {
                                const year = evt.fecha_inicio ? new Date(evt.fecha_inicio).getFullYear() : '--';
                                return (
                                    <div key={evt.id} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                        <div className="timeline-node active" style={{ position: 'relative' }}>
                                            {isEditMode && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`¿Está seguro que desea eliminar el hito "${evt.nombre}"?`)) {
                                                            handleDeleteEvent(evt.id);
                                                        }
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: -12,
                                                        right: -12,
                                                        background: 'hsl(var(--destructive))',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: 16,
                                                        height: 16,
                                                        fontSize: '9px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 10
                                                    }}
                                                    title="Eliminar hito"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                            <div className="timeline-dot" />
                                            <div className="timeline-year">{year}</div>
                                            <div className="timeline-label">{evt.nombre}</div>
                                        </div>
                                        {i < events.length - 1 && <div className="timeline-line" />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Event Modal */}
            {showAddEventModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'hsl(var(--foreground) / 0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAddEventModal(false)} />
                    <div className="card" style={{ position: 'relative', zIndex: 2001, width: 400, padding: 'var(--space-xl)' }}>
                        <button onClick={() => setShowAddEventModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}><X size={16} /></button>
                        <div className="section-title" style={{ marginBottom: 'var(--space-md)' }}>
                            Agregar Hito Histórico
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Nombre del Hito</label>
                                <input 
                                    className="input-field" 
                                    value={newEventForm.nombre} 
                                    onChange={e => setNewEventForm({ ...newEventForm, nombre: e.target.value })} 
                                    placeholder="Ej. Fundación del Apiario Pureo, Ritual de Floración..."
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Fecha de Inicio</label>
                                <DatePicker 
                                    className="w-full" 
                                    value={newEventForm.fecha_inicio} 
                                    onChange={val => setNewEventForm({ ...newEventForm, fecha_inicio: val })} 
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-xl)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setShowAddEventModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSaveEvent}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}

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
