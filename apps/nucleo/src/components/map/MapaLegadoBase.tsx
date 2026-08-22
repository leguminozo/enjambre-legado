import { useState, useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import type { Map } from 'leaflet';
import { supabase } from '../../lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { MapResizeWatcher } from '@/components/map/MapResizeWatcher';
import {
  EsriSatelliteTileLayers,
  DarkCartoTileLayer,
  createMapBadgeIcon,
  fixLeafletDefaultIcons,
} from '@/components/map/MapLayers';
import L from 'leaflet';
import { BOSQUE_ULMO, ORO_MIEL, ORO_MIEL_DARK, SALUD_OPTIMA } from '@/lib/colors';
import 'leaflet/dist/leaflet.css';
import { Plus, X, MapPin, Clock, ChevronLeft, ChevronRight, X as CloseIcon, Layers, Moon, Sun } from 'lucide-react';
import { toast, friendlyError, DatePicker, formatCLP, ImmersiveModal, overlayBackdropClassName } from '@enjambre/ui';
import { resolveClienteCoords, resolveComunaCoords } from '@/lib/cliente-coords';

fixLeafletDefaultIcons();

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

// ── Capas territoriales (Registro Territorial / Trama geo-temporal) ──────────

interface AlertaTerritorial {
  id: string;
  producto: string;
  zona: string;
  fecha_programada: string;
  estado: string;
  radio_km?: number | null;
  tipo_producto?: string | null;
  lat_aproximada?: number | null;
  lng_aproximada?: number | null;
}

interface TrashumanteActivo {
  id: string;
  nombre?: string | null;
  n_colmenas: number;
  comuna_origen: string;
  comuna_destino: string;
  zona_destino: string;
  lat_aproximada?: number | null;
  lng_aproximada?: number | null;
  fecha_ingreso: string;
  fecha_salida?: string | null;
  cert_sanitaria_fecha?: string | null;
  cert_sanitaria_lab?: string | null;
  estado: string;
  actores_registro?: { nombre_actor: string } | null;
}

interface PredioFacilitador {
  id: string;
  nombre?: string | null;
  comuna: string;
  zona: string;
  lat_aproximada?: number | null;
  lng_aproximada?: number | null;
  superficie_ha?: number | null;
  activo: boolean;
}

interface CensoApiario {
  id: string;
  nombre?: string | null;
  comuna: string;
  zona: string;
  n_colmenas: number;
  categoria: string;
  activo: boolean;
  lat_aproximada?: number | null;
  lng_aproximada?: number | null;
}

interface CosechaMapa {
  id: string;
  fecha: string | null;
  kg: number | null;
  floracion: string | null;
  colmenas?: {
    apiarios?: { id?: string; name?: string | null; lat?: number | null; lng?: number | null } | null;
  } | null;
}

interface HistorialApiario {
  apiario: {
    id: string;
    name: string | null;
    lat: number | null;
    lng: number | null;
    sector: string | null;
    details: string | null;
  };
  colmenas: Array<{
    id: string;
    name?: string | null;
    alzas?: number | null;
    last_inspection?: string | null;
    production_total?: number | null;
    inspecciones?: Array<{ id: string; date: string | null; fase?: string | null; marcos_cria?: number | null; marcos_miel?: number | null; varroa?: number | null; poblacion?: string | null }>;
    varroa_records?: Array<{ id: string; date: string | null; level: number | null; method?: string | null }>;
    peso_records?: Array<{ id: string; date: string | null; kg: number | null }>;
  }>;
  cosechas: Array<{ id: string; fecha: string | null; kg: number | null; floracion?: string | null; lote_id?: string | null; colmena_id?: string | null }>;
  tratamientos: Array<{ id: string; fecha: string | null; principio_activo?: string | null; producto_comercial?: string | null; enfermedad?: string | null; retiro_fin?: string | null }>;
  reinas: Array<{ id: string; fecha: string | null; estado?: string | null; reemplazada_por?: string | null }>;
}

// Iconos de las capas geo-temporales
function createLayerIcon(emoji: string, color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 14px;">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

const ICON_ALERTA = createLayerIcon('⚠️', 'hsl(var(--destructive))');
const ICON_TRASHUMANTE = createLayerIcon('🚚', 'hsl(var(--accent))');
const ICON_PREDIO = createLayerIcon('🌿', 'hsl(var(--success))');
const ICON_CENSO = createLayerIcon('🐝', 'hsl(var(--primary))');
const ICON_COSECHA = createLayerIcon('🍯', 'hsl(var(--warning, var(--accent)))');

export function MapaLegado({ height = '500px', filterRole }: MapaLegadoProps) {
    const apiFetch = useApiFetch();
    const [mapStyle, setMapStyle] = useState<'satellite' | 'dark'>('satellite');
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

    // Capas geo-temporales (Registro Territorial / Trama)
    const [showAlertas, setShowAlertas] = useState(true);
    const [showTrashumantes, setShowTrashumantes] = useState(true);
    const [showPredios, setShowPredios] = useState(true);
    const [showCensoApiarios, setShowCensoApiarios] = useState(true);
    const [showCosechas, setShowCosechas] = useState(true);

    const [alertas, setAlertas] = useState<AlertaTerritorial[]>([]);
    const [trashumantes, setTrashumantes] = useState<TrashumanteActivo[]>([]);
    const [predios, setPredios] = useState<PredioFacilitador[]>([]);
    const [censoApiarios, setCensoApiarios] = useState<CensoApiario[]>([]);
    const [cosechasMapa, setCosechasMapa] = useState<CosechaMapa[]>([]);

    // Timeline geo-temporal: 'ahora' (default) o un mes del pasado
    const [esAhora, setEsAhora] = useState(true);
    const [fechaEnfocada, setFechaEnfocada] = useState(() =>
        new Date().toISOString().slice(0, 7)
    );

    // Ficha geo-temporal del apiario (panel lateral con la línea de vida)
    const [apiarioSeleccionado, setApiarioSeleccionado] = useState<{ id: string; name: string } | null>(null);
    const [historialApiario, setHistorialApiario] = useState<HistorialApiario | null>(null);
    const [loadingHistorial, setLoadingHistorial] = useState(false);

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

                // ── Capas geo-temporales (Registro Territorial / Trama) ──
                const [alertasRes, trashumRes, prediosRes, censoRes] = await Promise.all([
                    apiFetch('/api/registro-territorial/alertas'),
                    apiFetch('/api/registro-territorial/apiarios-externos'),
                    apiFetch('/api/registro-territorial/predios'),
                    apiFetch('/api/registro-territorial/apiarios'),
                ]);
                const alertasJson = alertasRes.ok ? await alertasRes.json() : { data: [] };
                const trashumJson = trashumRes.ok ? await trashumRes.json() : { data: [] };
                const prediosJson = prediosRes.ok ? await prediosRes.json() : { data: [] };
                const censoJson = censoRes.ok ? await censoRes.json() : { data: [] };
                setAlertas(alertasJson.data ?? []);
                setTrashumantes(trashumJson.data ?? []);
                setPredios(prediosJson.data ?? []);
                setCensoApiarios(censoJson.data ?? []);

                // Cosechas con geolocalización (vía colmena → apiario) para la capa temporal
                const { data: cosechasGeo } = await supabase
                    .from('cosechas')
                    .select('id, fecha, kg, floracion, colmenas(apiarios(id, name, lat, lng))')
                    .not('fecha', 'is', null)
                    .order('fecha', { ascending: false })
                    .limit(500);
                setCosechasMapa(cosechasGeo ?? []);

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
                        details: spent > 0 ? `Cliente activo · ${formatCLP(Math.round(spent))}` : 'Punto de venta',
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

    // ── Timeline geo-temporal: 'ahora' o un mes del pasado ──
    const fechaFocus = esAhora ? new Date() : new Date(`${fechaEnfocada}-01T12:00:00`);
    const mesInicio = new Date(fechaFocus.getFullYear(), fechaFocus.getMonth(), 1);
    const mesFin = new Date(fechaFocus.getFullYear(), fechaFocus.getMonth() + 1, 0, 23, 59, 59);

    // Trashumantes presentes en la ventana temporal (ingreso ≤ t ≤ salida)
    const trashumantesVisibles = trashumantes.filter(t => {
        if (t.lat_aproximada == null || t.lng_aproximada == null) return false;
        const ingreso = new Date(t.fecha_ingreso);
        const salida = t.fecha_salida ? new Date(t.fecha_salida) : null;
        if (esAhora) {
            return ingreso <= fechaFocus && (!salida || salida >= fechaFocus);
        }
        return ingreso <= mesFin && (!salida || salida >= mesInicio);
    });

    // Alertas visibles: ±7 días alrededor de 'ahora', o dentro del mes enfocado
    const alertasVisibles = alertas.filter(a => {
        if (a.lat_aproximada == null || a.lng_aproximada == null) return false;
        const prog = new Date(a.fecha_programada);
        if (esAhora) {
            const diff = Math.abs(prog.getTime() - fechaFocus.getTime()) / 86_400_000;
            return diff <= 7;
        }
        return prog >= mesInicio && prog <= mesFin;
    });

    // Cosechas con geo dentro de la ventana temporal
    const cosechasVisibles = cosechasMapa.filter(c => {
        if (!c.fecha || c.colmenas?.apiarios?.lat == null || c.colmenas?.apiarios?.lng == null) return false;
        const f = new Date(c.fecha);
        if (esAhora) {
            return f.getFullYear() === fechaFocus.getFullYear() && f.getMonth() === fechaFocus.getMonth();
        }
        return f >= mesInicio && f <= mesFin;
    });

    // Eventos/ferias: en un mes enfocado solo los de ese mes
    if (!esAhora) {
        filteredMarkers = filteredMarkers.filter(m => {
            if (m.type !== 'feria' || !m.details) return true;
            const f = new Date(m.details);
            return f >= mesInicio && f <= mesFin;
        });
    }

    // ── Ficha geo-temporal del apiario (bitácora Trama) ──
    const abrirFichaApiario = async (apiarioId: string, nombre: string) => {
        setApiarioSeleccionado({ id: apiarioId, name: nombre });
        setHistorialApiario(null);
        setLoadingHistorial(true);
        try {
            const res = await apiFetch(`/api/mapa/historial/apiario/${apiarioId}`);
            if (!res.ok) throw new Error('Error cargando historial');
            const json = await res.json();
            setHistorialApiario(json.data as HistorialApiario);
        } catch (e) {
            toast(friendlyError(e, 'Error al cargar la bitácora del apiario'), { type: 'error' });
        } finally {
            setLoadingHistorial(false);
        }
    };

    const cerrarFichaApiario = () => {
        setApiarioSeleccionado(null);
        setHistorialApiario(null);
    };

    const irMes = (delta: number) => {
        const d = new Date(`${fechaEnfocada}-01T12:00:00`);
        d.setMonth(d.getMonth() + delta);
        setFechaEnfocada(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        setEsAhora(false);
    };

    const volverAhora = () => {
        setEsAhora(true);
        setFechaEnfocada(new Date().toISOString().slice(0, 7));
    };

    // ── Línea de vida unificada del apiario (bitácora Trama) ──
    const lineaVida = (() => {
        if (!historialApiario) return [];
        const items: Array<{ fecha: string; tipo: string; texto: string }> = [];
        for (const col of historialApiario.colmenas) {
            const nombre = col.name ?? 'Colmena';
            for (const ins of col.inspecciones ?? []) {
                items.push({
                    fecha: ins.date ?? '',
                    tipo: '🔍 Inspección',
                    texto: `${nombre}: ${ins.fase ?? 'revisión'}${ins.marcos_cria != null ? ` · ${ins.marcos_cria} cuadros cría` : ''}${ins.marcos_miel != null ? ` · ${ins.marcos_miel} miel` : ''}${ins.varroa != null ? ` · varroa ${ins.varroa}%` : ''}`,
                });
            }
            for (const v of col.varroa_records ?? []) {
                items.push({ fecha: v.date ?? '', tipo: '🐜 Varroa', texto: `${nombre}: ${v.level}%${v.method ? ` (${v.method})` : ''}` });
            }
            for (const p of col.peso_records ?? []) {
                items.push({ fecha: p.date ?? '', tipo: '⚖️ Peso', texto: `${nombre}: ${p.kg} kg` });
            }
        }
        for (const c of historialApiario.cosechas) {
            items.push({
                fecha: c.fecha ?? '',
                tipo: '🍯 Cosecha',
                texto: `${c.kg} kg${c.floracion ? ` · ${c.floracion}` : ''}${c.lote_id ? ` → lote ${c.lote_id.slice(0, 8)}` : ''}`,
            });
        }
        for (const t of historialApiario.tratamientos) {
            items.push({
                fecha: t.fecha ?? '',
                tipo: '⚕️ Tratamiento',
                texto: `${t.principio_activo ?? t.producto_comercial ?? 'Tratamiento'}${t.retiro_fin ? ` · retiro hasta ${t.retiro_fin}` : ''}`,
            });
        }
        for (const r of historialApiario.reinas) {
            items.push({ fecha: r.fecha ?? '', tipo: '👑 Reina', texto: r.estado ?? 'Registro' });
        }
        return items
            .filter((i) => i.fecha)
            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    })();

    // Chiloé center
    const center: [number, number] = [-42.47, -73.73];

    return (
        <div>
            {/* Map */}
            <div className="map-container" style={{ height }}>
                <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Layer Toggles */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: 'hsl(var(--card) / 0.8)', border: '1px solid hsl(var(--border) / 0.5)', borderRadius: 'var(--radius-md)', padding: 6, backdropFilter: 'blur(8px)' }}>
                        <button
                            type="button"
                            onClick={() => setShowApiarios(!showApiarios)}
                            className={`btn btn-sm ${showApiarios ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                minHeight: 44,
                                padding: '0.5rem 0.75rem', 
                                fontSize: '0.72rem',
                                background: showApiarios ? 'hsl(var(--primary))' : 'transparent',
                                color: showApiarios ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
                            }}
                        >
                            🐝 Apiarios
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowTrees(!showTrees)}
                            className={`btn btn-sm ${showTrees ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                minHeight: 44,
                                padding: '0.5rem 0.75rem', 
                                fontSize: '0.72rem',
                                background: showTrees ? 'hsl(var(--primary))' : 'transparent',
                                color: showTrees ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
                            }}
                        >
                            🌳 Árboles
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowTransito(!showTransito)}
                            className={`btn btn-sm ${showTransito ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                minHeight: 44,
                                padding: '0.5rem 0.75rem', 
                                fontSize: '0.72rem',
                                background: showTransito ? 'hsl(var(--info, var(--primary)))' : 'transparent',
                                color: showTransito ? 'hsl(var(--info-foreground, var(--primary-foreground)))' : 'hsl(var(--foreground))'
                            }}
                        >
                            📦 En Tránsito
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAltaProduccion(!showAltaProduccion)}
                            className={`btn btn-sm ${showAltaProduccion ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                minHeight: 44,
                                padding: '0.5rem 0.75rem', 
                                fontSize: '0.72rem',
                                background: showAltaProduccion ? 'hsl(var(--accent))' : 'transparent',
                                color: showAltaProduccion ? 'hsl(var(--accent-foreground, var(--primary-foreground)))' : 'hsl(var(--foreground))'
                            }}
                        >
                            🌟 Alta Producción
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAlertas(!showAlertas)}
                            className={`btn btn-sm ${showAlertas ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                minHeight: 44,
                                padding: '0.5rem 0.75rem', 
                                fontSize: '0.72rem',
                                background: showAlertas ? 'hsl(var(--destructive))' : 'transparent',
                                color: showAlertas ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
                            }}
                        >
                            ⚠️ Alertas
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowTrashumantes(!showTrashumantes)}
                            className={`btn btn-sm ${showTrashumantes ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                minHeight: 44,
                                padding: '0.5rem 0.75rem', 
                                fontSize: '0.72rem',
                                background: showTrashumantes ? 'hsl(var(--accent))' : 'transparent',
                                color: showTrashumantes ? 'hsl(var(--accent-foreground, var(--primary-foreground)))' : 'hsl(var(--foreground))'
                            }}
                        >
                            🚚 Trashumantes
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowPredios(!showPredios)}
                            className={`btn btn-sm ${showPredios ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                minHeight: 44,
                                padding: '0.5rem 0.75rem', 
                                fontSize: '0.72rem',
                                background: showPredios ? 'hsl(var(--success))' : 'transparent',
                                color: showPredios ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
                            }}
                        >
                            🌿 Predios
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCensoApiarios(!showCensoApiarios)}
                            className={`btn btn-sm ${showCensoApiarios ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                minHeight: 44,
                                padding: '0.5rem 0.75rem', 
                                fontSize: '0.72rem',
                                background: showCensoApiarios ? 'hsl(var(--primary))' : 'transparent',
                                color: showCensoApiarios ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
                            }}
                        >
                            🐝 Censo
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCosechas(!showCosechas)}
                            className={`btn btn-sm ${showCosechas ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ 
                                minHeight: 44,
                                padding: '0.5rem 0.75rem', 
                                fontSize: '0.72rem',
                                background: showCosechas ? 'hsl(var(--warning, var(--accent)))' : 'transparent',
                                color: showCosechas ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
                            }}
                        >
                            🍯 Cosechas
                        </button>
                    </div>

                    {/* Timeline geo-temporal */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'hsl(var(--card) / 0.85)', border: '1px solid hsl(var(--border) / 0.5)', borderRadius: 'var(--radius-md)', padding: '4px 6px', backdropFilter: 'blur(8px)' }}>
                        <button
                            type="button"
                            onClick={() => irMes(-1)}
                            className="btn btn-ghost btn-sm"
                            style={{ minHeight: 36, padding: '0.3rem 0.5rem', fontSize: '0.72rem', color: 'hsl(var(--foreground))' }}
                            title="Mes anterior"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        {esAhora ? (
                            <button
                                type="button"
                                onClick={volverAhora}
                                className="btn btn-primary btn-sm"
                                style={{ minHeight: 36, padding: '0.3rem 0.6rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                <Clock size={12} /> Hoy
                            </button>
                        ) : (
                            <input
                                type="month"
                                value={fechaEnfocada}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setFechaEnfocada(e.target.value);
                                        setEsAhora(false);
                                    }
                                }}
                                className="input-field"
                                style={{ minHeight: 36, padding: '0.3rem 0.5rem', fontSize: '0.72rem', width: 130, background: 'transparent', border: 'none', color: 'hsl(var(--foreground))' }}
                            />
                        )}
                        <button
                            type="button"
                            onClick={() => irMes(1)}
                            className="btn btn-ghost btn-sm"
                            style={{ minHeight: 36, padding: '0.3rem 0.5rem', fontSize: '0.72rem', color: 'hsl(var(--foreground))' }}
                            title="Mes siguiente"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMapStyle(mapStyle === 'satellite' ? 'dark' : 'satellite')}
                        className="btn btn-sm btn-ghost"
                        style={{ 
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            color: 'hsl(var(--foreground))',
                            minHeight: 36,
                            padding: '0.3rem 0.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                        title={mapStyle === 'satellite' ? 'Cambiar a mapa oscuro' : 'Cambiar a satélite'}
                    >
                        {mapStyle === 'satellite' ? <Moon size={14} /> : <Sun size={14} />}
                        <span className="hidden sm:inline">{mapStyle === 'satellite' ? 'Satélite' : 'Oscuro'}</span>
                    </button>

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
                    attributionControl={false}
                >
                    {mapStyle === 'satellite' ? (
                        <EsriSatelliteTileLayers />
                    ) : (
                        <DarkCartoTileLayer />
                    )}
                    <FitBounds markers={filteredMarkers} />
                    <MapResizeWatcher />
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
                                },
                                click: () => {
                                    if (marker.type === 'obrera' || marker.type === 'alta_produccion') {
                                        const apiarioId = marker.id.startsWith('api-') ? marker.id.substring(4) : marker.id;
                                        abrirFichaApiario(apiarioId, marker.name);
                                    }
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

                    {/* ── Capa geo-temporal: cosechas del mes (🍯) ── */}
                    {!filterRole && showCosechas && cosechasVisibles.map((c) => {
                        const api = c.colmenas?.apiarios;
                        if (api?.lat == null || api?.lng == null) return null;
                        return (
                            <Marker
                                key={`cosecha-${c.id}`}
                                position={[api.lat, api.lng]}
                                icon={ICON_COSECHA}
                            >
                                <Popup>
                                    <div style={{ minWidth: 180 }}>
                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>🍯 Cosecha</div>
                                        <strong style={{ fontSize: '0.95rem', color: BOSQUE_ULMO }}>{c.kg != null ? `${c.kg} kg` : 'Cosecha'}</strong>
                                        {c.floracion && (
                                            <p style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', marginTop: 6 }}>{c.floracion}</p>
                                        )}
                                        {c.fecha && (
                                            <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                                                {new Date(c.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* ── Capa geo-temporal: alertas fitosanitarias (⚠️ + radio) ── */}
                    {!filterRole && showAlertas && alertasVisibles.map((a) => {
                        if (a.lat_aproximada == null || a.lng_aproximada == null) return null;
                        return (
                            <div key={`alerta-${a.id}`}>
                                <Circle
                                    center={[a.lat_aproximada, a.lng_aproximada]}
                                    radius={(a.radio_km || 3) * 1000}
                                    pathOptions={{
                                        color: 'hsl(var(--destructive))',
                                        fillColor: 'hsl(var(--destructive))',
                                        fillOpacity: 0.12,
                                        weight: 1,
                                    }}
                                />
                                <Marker position={[a.lat_aproximada, a.lng_aproximada]} icon={ICON_ALERTA}>
                                    <Popup>
                                        <div style={{ minWidth: 200 }}>
                                            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--destructive))', marginBottom: 4 }}>⚠️ Alerta Fitosanitaria</div>
                                            <strong style={{ fontSize: '0.95rem', color: BOSQUE_ULMO }}>{a.producto}</strong>
                                            <p style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', marginTop: 6 }}>
                                                {a.zona}{a.tipo_producto ? ` · ${a.tipo_producto}` : ''}
                                            </p>
                                            <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                                                {new Date(a.fecha_programada).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })} · radio {a.radio_km || 3} km
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>
                            </div>
                        );
                    })}

                    {/* ── Capa geo-temporal: trashumantes con trayectoria (🚚 + polyline) ── */}
                    {!filterRole && showTrashumantes && trashumantesVisibles.map((t) => {
                        if (t.lat_aproximada == null || t.lng_aproximada == null) return null;
                        const origen = resolveComunaCoords(t.comuna_origen);
                        return (
                            <div key={`trashum-${t.id}`}>
                                {origen && (
                                    <Polyline
                                        positions={[[origen.lat, origen.lng], [t.lat_aproximada, t.lng_aproximada]]}
                                        pathOptions={{ color: 'hsl(var(--accent))', weight: 2, dashArray: '6, 6', opacity: 0.8 }}
                                    />
                                )}
                                <Marker position={[t.lat_aproximada, t.lng_aproximada]} icon={ICON_TRASHUMANTE}>
                                    <Popup>
                                        <div style={{ minWidth: 200 }}>
                                            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--accent))', marginBottom: 4 }}>🚚 Trashumante</div>
                                            <strong style={{ fontSize: '0.95rem', color: BOSQUE_ULMO }}>
                                                {t.actores_registro?.nombre_actor ?? t.nombre ?? 'Trashumante'}
                                            </strong>
                                            <p style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', marginTop: 6 }}>
                                                {t.comuna_origen} → {t.comuna_destino} · {t.zona_destino}
                                            </p>
                                            <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                                                🐝 {t.n_colmenas} colmenas · Ingreso {t.fecha_ingreso}
                                                {t.fecha_salida ? ` · Salida ${t.fecha_salida}` : ''}
                                            </p>
                                            {(t.cert_sanitaria_fecha || t.cert_sanitaria_lab) && (
                                                <p style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                                                    Cert. sanitaria: {t.cert_sanitaria_lab ?? '—'} · {t.cert_sanitaria_fecha ?? '—'}
                                                </p>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            </div>
                        );
                    })}

                    {/* ── Capa: predios facilitadores (🌿) ── */}
                    {!filterRole && showPredios && predios
                        .filter(p => p.activo && p.lat_aproximada != null && p.lng_aproximada != null)
                        .map((p) => (
                            <Marker
                                key={`predio-${p.id}`}
                                position={[p.lat_aproximada as number, p.lng_aproximada as number]}
                                icon={ICON_PREDIO}
                            >
                                <Popup>
                                    <div style={{ minWidth: 180 }}>
                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--success))', marginBottom: 4 }}>🌿 Predio Facilitador</div>
                                        <strong style={{ fontSize: '0.95rem', color: BOSQUE_ULMO }}>{p.nombre ?? 'Predio'}</strong>
                                        <p style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', marginTop: 6 }}>
                                            {p.zona} · {p.comuna}
                                        </p>
                                        {p.superficie_ha != null && (
                                            <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                                                {p.superficie_ha} ha
                                            </p>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                    {/* ── Capa: apiarios del censo comunal (🐝) ── */}
                    {!filterRole && showCensoApiarios && censoApiarios
                        .filter(a => a.activo && a.lat_aproximada != null && a.lng_aproximada != null)
                        .map((a) => (
                            <Marker
                                key={`censo-${a.id}`}
                                position={[a.lat_aproximada as number, a.lng_aproximada as number]}
                                icon={ICON_CENSO}
                            >
                                <Popup>
                                    <div style={{ minWidth: 180 }}>
                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--primary))', marginBottom: 4 }}>🐝 Apiario del Registro</div>
                                        <strong style={{ fontSize: '0.95rem', color: BOSQUE_ULMO }}>{a.nombre ?? 'Apiario comunal'}</strong>
                                        <p style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', marginTop: 6 }}>
                                            {a.zona} · {a.comuna}
                                        </p>
                                        <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                                            🐝 {a.n_colmenas} colmenas · {a.categoria}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                </MapContainer>
            </div>

            {/* ── Ficha geo-temporal del apiario (bitácora Trama) ── */}
            {apiarioSeleccionado && (
                <>
                {/* Backdrop compartido con ImmersiveModal (foco; clic cierra) */}
                <button
                    type="button"
                    className={`fixed inset-0 z-[1490] border-0 p-0 cursor-default ${overlayBackdropClassName}`}
                    aria-label="Cerrar bitácora"
                    onClick={cerrarFichaApiario}
                />
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Bitácora del apiario ${apiarioSeleccionado.name}`}
                    style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, maxWidth: '92vw', zIndex: 1500, background: 'hsl(var(--card))', borderLeft: '1px solid hsl(var(--border))', overflowY: 'auto', padding: 'var(--space-lg)', boxShadow: '-10px 0 40px rgba(0,0,0,0.45)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                        <div>
                            <div className="section-title" style={{ marginBottom: 4 }}>Bitácora del Apiario</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: BOSQUE_ULMO }}>
                                🐝 {apiarioSeleccionado.name}
                            </div>
                            {historialApiario?.apiario?.sector && (
                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                                    {historialApiario.apiario.sector}
                                </div>
                            )}
                        </div>
                        <button type="button" onClick={cerrarFichaApiario} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }} aria-label="Cerrar">
                            <CloseIcon size={18} />
                        </button>
                    </div>

                    {loadingHistorial ? (
                        <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem' }}>
                            Cargando la línea de vida...
                        </div>
                    ) : !historialApiario ? (
                        <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem' }}>
                            Sin historial disponible.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {/* Resumen */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                <div style={{ background: 'hsl(var(--surface-raised, var(--card)))', border: '1px solid hsl(var(--border) / 0.5)', borderRadius: 'var(--radius-md)', padding: 10, textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{historialApiario.colmenas.length}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>Colmenas</div>
                                </div>
                                <div style={{ background: 'hsl(var(--surface-raised, var(--card)))', border: '1px solid hsl(var(--border) / 0.5)', borderRadius: 'var(--radius-md)', padding: 10, textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{historialApiario.cosechas.length}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>Cosechas</div>
                                </div>
                                <div style={{ background: 'hsl(var(--surface-raised, var(--card)))', border: '1px solid hsl(var(--border) / 0.5)', borderRadius: 'var(--radius-md)', padding: 10, textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{lineaVida.length}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>Eventos</div>
                                </div>
                            </div>

                            {/* Línea de vida cronológica */}
                            <div>
                                <div className="section-subtitle" style={{ marginBottom: 'var(--space-sm)' }}>Línea de vida</div>
                                {lineaVida.length === 0 ? (
                                    <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>
                                        Aún no hay eventos registrados para este apiario.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                        {lineaVida.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 12, position: 'relative' }}>
                                                {i < lineaVida.length - 1 && (
                                                    <div style={{ position: 'absolute', left: 9, top: 20, bottom: 0, width: 2, background: 'hsl(var(--border) / 0.6)' }} />
                                                )}
                                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'hsl(var(--primary) / 0.12)', border: '2px solid hsl(var(--primary) / 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', flexShrink: 0, zIndex: 1 }}>
                                                    {item.tipo.slice(0, 1)}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{item.tipo}</span>
                                                        <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>
                                                            {new Date(item.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginTop: 2, lineHeight: 1.4 }}>{item.texto}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                </>
            )}

            {/* Add Marker Modal */}
            <ImmersiveModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                size="md"
                eyebrow="Mapa"
                title="Agregar al Mapa"
                footer={
                    <>
                        <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancelar</button>
                        <button type="button" className="btn btn-primary" onClick={handleSaveMarker}>Guardar</button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Tipo</label>
                        <select
                            className="input-field w-full"
                            value={newMarkerForm.type}
                            onChange={(e) => setNewMarkerForm({ ...newMarkerForm, type: e.target.value as 'obrera' | 'tree' })}
                        >
                            <option value="obrera">🐝 Apiario</option>
                            <option value="tree">🌳 Árbol</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Nombre</label>
                        <input
                            className="input-field w-full"
                            value={newMarkerForm.name}
                            onChange={(e) => setNewMarkerForm({ ...newMarkerForm, name: e.target.value })}
                            placeholder={newMarkerForm.type === 'obrera' ? 'Ej. Apiario Norte' : 'Ej. Ulmo'}
                        />
                    </div>
                    {newMarkerForm.type === 'obrera' && (
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Detalles (opcional)</label>
                            <input
                                className="input-field w-full"
                                value={newMarkerForm.details}
                                onChange={(e) => setNewMarkerForm({ ...newMarkerForm, details: e.target.value })}
                                placeholder="Sector, notas adicionales..."
                            />
                        </div>
                    )}
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
                        Coordenadas: {newMarkerCoords?.lat.toFixed(6)}, {newMarkerCoords?.lng.toFixed(6)}
                    </div>
                </div>
            </ImmersiveModal>

            {/* Edit Marker Modal */}
            <ImmersiveModal
                open={Boolean(showEditModal && selectedMarker)}
                onClose={() => setShowEditModal(false)}
                size="md"
                eyebrow="Mapa"
                title="Editar Marcador"
                footer={
                    selectedMarker ? (
                        <>
                            <button
                                type="button"
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
                            <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>
                                Cancelar
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleUpdateMarker}>
                                Guardar
                            </button>
                        </>
                    ) : null
                }
            >
                {selectedMarker && (
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
                                className="input-field w-full"
                                value={editMarkerForm.name}
                                onChange={(e) => setEditMarkerForm({ ...editMarkerForm, name: e.target.value })}
                                placeholder={selectedMarker.type === 'obrera' ? 'Ej. Apiario Norte' : 'Ej. Ulmo'}
                            />
                        </div>
                        {selectedMarker.type === 'obrera' && (
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Detalles (opcional)</label>
                                <input
                                    className="input-field w-full"
                                    value={editMarkerForm.details}
                                    onChange={(e) => setEditMarkerForm({ ...editMarkerForm, details: e.target.value })}
                                    placeholder="Sector, notas adicionales..."
                                />
                            </div>
                        )}
                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
                            Coordenadas: {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                        </div>
                    </div>
                )}
            </ImmersiveModal>

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
            <ImmersiveModal
                open={showAddEventModal}
                onClose={() => setShowAddEventModal(false)}
                size="md"
                eyebrow="Mapa"
                title="Agregar Hito Histórico"
                footer={
                    <>
                        <button type="button" className="btn btn-ghost" onClick={() => setShowAddEventModal(false)}>
                            Cancelar
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleSaveEvent}>
                            Guardar
                        </button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Nombre del Hito</label>
                        <input
                            className="input-field w-full"
                            value={newEventForm.nombre}
                            onChange={(e) => setNewEventForm({ ...newEventForm, nombre: e.target.value })}
                            placeholder="Ej. Fundación del Apiario Pureo, Ritual de Floración..."
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Fecha de Inicio</label>
                        <DatePicker
                            className="w-full"
                            value={newEventForm.fecha_inicio}
                            onChange={(val) => setNewEventForm({ ...newEventForm, fecha_inicio: val })}
                        />
                    </div>
                </div>
            </ImmersiveModal>

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
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'hsl(var(--destructive))', border: '2px solid white', display: 'inline-block', fontSize: '0.55rem', textAlign: 'center', lineHeight: '14px' }}>⚠️</span> Alerta fitosanitaria (radio)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'hsl(var(--accent))', border: '2px solid white', display: 'inline-block', fontSize: '0.55rem', textAlign: 'center', lineHeight: '14px' }}>🚚</span> Trashumante (trayectoria)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'hsl(var(--success))', border: '2px solid white', display: 'inline-block', fontSize: '0.55rem', textAlign: 'center', lineHeight: '14px' }}>🌿</span> Predio facilitador
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'hsl(var(--primary))', border: '2px solid white', display: 'inline-block', fontSize: '0.55rem', textAlign: 'center', lineHeight: '14px' }}>🐝</span> Apiario del censo
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'hsl(var(--warning, var(--accent)))', border: '2px solid white', display: 'inline-block', fontSize: '0.55rem', textAlign: 'center', lineHeight: '14px' }}>🍯</span> Cosecha del mes
                    </span>
                </div>
            </div>
        </div>
    );
}
