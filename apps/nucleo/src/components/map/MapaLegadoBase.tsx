import { useState, useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { supabase } from '../../lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { MapResizeWatcher } from '@/components/map/MapResizeWatcher';
import {
  EsriSatelliteTileLayers,
  DarkCartoTileLayer,
  fixLeafletDefaultIcons,
} from '@/components/map/MapLayers';
import L from 'leaflet';
import { BOSQUE_ULMO, ORO_MIEL, ORO_MIEL_DARK, SALUD_OPTIMA } from '@/lib/colors';
import 'leaflet/dist/leaflet.css';
import { MapPin, Clock, ChevronLeft, ChevronRight, Moon, Sun, Plus } from 'lucide-react';
import { toast, friendlyError, formatCLP, ImmersiveModal } from '@enjambre/ui';
import { resolveClienteCoords, resolveComunaCoords } from '@/lib/cliente-coords';

fixLeafletDefaultIcons();

export type MarkerDomain = 'tienda' | 'campo' | 'territorio';

export interface MapMarker {
  id: string;
  type:
    | 'obrera'
    | 'alta_produccion'
    | 'tree'
    | 'cafeteria'
    | 'tienda_gourmet'
    | 'hotel'
    | 'cliente_b2b'
    | 'transito'
    | 'feria'
    | 'revendedor'
    | 'zangano'
    | 'nectar';
  domain: MarkerDomain;
  name: string;
  lat: number;
  lng: number;
  health?: 'optimal' | 'attention' | 'risk';
  details?: string;
  alzas?: number;
  ciudad?: string;
  segmento?: string;
}

function generarCodigoAcceso(longitud = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < longitud; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

function createCustomIcon(marker: MapMarker): L.DivIcon {
  const configs: Record<string, { className: string; html: string }> = {
    obrera: {
      className: 'marker-obrera',
      html: `<div class="marker-obrera-inner health-${marker.health || 'optimal'}">
<span style="transform:rotate(45deg);font-size:14px;">🐝</span>
</div>`,
    },
    alta_produccion: {
      className: 'marker-obrera',
      html: `<div class="marker-obrera-inner health-optimal" style="box-shadow: 0 0 15px 5px hsl(var(--accent) / 0.8); transform: scale(1.2);">
<span style="rotate:45deg;font-size:14px;">🌟</span>
</div>`,
    },
    tree: {
      className: 'marker-obrera',
      html: `<div class="marker-tree-inner" style="display:flex;align-items:center;justify-content:center;">
<span style="font-size:14px;">🌳</span>
</div>`,
    },
    cafeteria: {
      className: 'marker-obrera',
      html: `<div class="marker-zangano-inner" style="background:hsl(var(--warning) / 0.9);border-color:hsl(var(--foreground));display:flex;align-items:center;justify-content:center;">
<span style="font-size:13px;transform:none;">☕</span>
</div>`,
    },
    tienda_gourmet: {
      className: 'marker-obrera',
      html: `<div class="marker-zangano-inner" style="background:hsl(var(--accent));border-color:hsl(var(--primary));display:flex;align-items:center;justify-content:center;">
<span style="font-size:13px;transform:none;">🛍️</span>
</div>`,
    },
    hotel: {
      className: 'marker-obrera',
      html: `<div class="marker-zangano-inner" style="background:hsl(var(--surface-raised));border-color:hsl(var(--accent));display:flex;align-items:center;justify-content:center;">
<span style="font-size:13px;transform:none;">🏨</span>
</div>`,
    },
    cliente_b2b: {
      className: 'marker-obrera',
      html: `<div class="marker-nectar-inner" style="background:hsl(var(--primary));border-color:hsl(var(--primary-foreground));display:flex;align-items:center;justify-content:center;">
<span style="font-size:12px;transform:none;">💼</span>
</div>`,
    },
    transito: {
      className: 'marker-obrera',
      html: `<div class="marker-nectar-inner" style="background:hsl(var(--info, var(--primary)));border-color:hsl(var(--info-foreground, var(--primary-foreground)));display:flex;align-items:center;justify-content:center;">
<span style="font-size:12px;transform:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">📦</span>
</div>`,
    },
    feria: {
      className: 'marker-obrera',
      html: `<div class="marker-zangano-inner" style="background:hsl(var(--destructive) / 0.85);border-color:hsl(var(--accent));display:flex;align-items:center;justify-content:center;">
<span style="font-size:12px;transform:none;">🎪</span>
</div>`,
    },
    revendedor: {
      className: 'marker-obrera',
      html: `<div class="marker-zangano-inner" style="background:hsl(var(--accent) / 0.85);border-color:hsl(var(--primary));display:flex;align-items:center;justify-content:center;">
<span style="font-size:12px;transform:none;">🤝</span>
</div>`,
    },
    nectar: {
      className: 'marker-obrera',
      html: `<div class="marker-nectar-inner"></div>`,
    },
    zangano: {
      className: 'marker-obrera',
      html: `<div class="marker-zangano-inner" title="${marker.name}"></div>`,
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
    case 'obrera': return '🐝 Apiario Propio';
    case 'alta_produccion': return '🌟 Súper-Colmenas (+2 Alzas)';
    case 'tree': return '🌳 Bosque Regenerado';
    case 'cafeteria': return '☕ Cafetería con Miel';
    case 'tienda_gourmet': return '🛍️ Tienda Gourmet / Emporio';
    case 'hotel': return '🏨 Hotel / Hospedaje Boutique';
    case 'cliente_b2b': return '💼 Cliente B2B / Mayorista';
    case 'transito': return '📦 Pedido Online en Tránsito';
    case 'feria': return '🎪 Feria / Evento Comercial';
    case 'revendedor': return '🤝 Revendedor Autorizado';
    case 'zangano': return '🔭 Punto Estratégico';
    case 'nectar': return '💧 Punto de Venta';
    default: return '';
  }
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!fitted.current && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      fitted.current = true;
    }
  }, [markers, map]);

  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export type MapEnvironment = 'enjambre' | 'tienda' | 'campo' | 'territorio';

interface MapaLegadoProps {
  height?: string;
  filterRole?: string;
}

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
  // Campos reservados del titular para prospección y compra de miel
  titular?: string | null;
  rut?: string | null;
  telefono?: string | null;
  email?: string | null;
  rup?: string | null;
  rol_apicola?: string | null;
  practicas_sanitarias?: string | null;
  metodo_control_varroa?: string | null;
  declaracion_sag?: boolean;
  nivel_acreditacion?: string | null;
  consentimiento_mapa?: boolean;
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

function createLayerIcon(emoji: string, color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid hsl(var(--background)); box-shadow: 0 4px 12px rgba(0,0,0,0.45); font-size: 14px;">${emoji}</div>`,
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

export function MapaLegado({ height = '620px', filterRole }: MapaLegadoProps) {
  const apiFetch = useApiFetch();
  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark'>('satellite');
  const [activeEnv, setActiveEnv] = useState<MapEnvironment>('enjambre');
  const [liveMarkers, setLiveMarkers] = useState<MapMarker[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMarkerCoords, setNewMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Formulario enriquecido para creación de cualquier tipo de pin / evento
  const [newMarkerForm, setNewMarkerForm] = useState<{
    type: 'obrera' | 'tree' | 'feria' | 'cafeteria' | 'tienda_gourmet' | 'hotel' | 'revendedor';
    name: string;
    details: string;
    ciudad: string;
    fecha_inicio: string;
  }>({
    type: 'obrera',
    name: '',
    details: '',
    ciudad: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
  });

  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMarkerForm, setEditMarkerForm] = useState({ name: '', details: '' });

  // Toggles Territorio & Apiarios propios
  const [showApiarios, setShowApiarios] = useState(true);
  const [showTrees, setShowTrees] = useState(true);
  const [showAltaProduccion, setShowAltaProduccion] = useState(true);
  const [showAlertas, setShowAlertas] = useState(true);
  const [showTrashumantes, setShowTrashumantes] = useState(true);
  const [showPredios, setShowPredios] = useState(true);
  const [showCensoApiarios, setShowCensoApiarios] = useState(true);
  const [showCosechas, setShowCosechas] = useState(true);

  // Toggles Tienda (obrerayzangano.cl)
  const [showCafeterias, setShowCafeterias] = useState(true);
  const [showTiendasGourmet, setShowTiendasGourmet] = useState(true);
  const [showHoteles, setShowHoteles] = useState(true);
  const [showClientesB2B, setShowClientesB2B] = useState(true);
  const [showTransito, setShowTransito] = useState(true);

  // Toggles Campo (POS & Ferias)
  const [showFerias, setShowFerias] = useState(true);
  const [showRevendedores, setShowRevendedores] = useState(true);

  const [alertas, setAlertas] = useState<AlertaTerritorial[]>([]);
  const [trashumantes, setTrashumantes] = useState<TrashumanteActivo[]>([]);
  const [predios, setPredios] = useState<PredioFacilitador[]>([]);
  const [censoApiarios, setCensoApiarios] = useState<CensoApiario[]>([]);
  const [cosechasMapa, setCosechasMapa] = useState<CosechaMapa[]>([]);

  // Timeline geo-temporal estacional
  const [esAhora, setEsAhora] = useState(true);
  const [fechaEnfocada, setFechaEnfocada] = useState(() => new Date().toISOString().slice(0, 7));

  // Ficha geo-temporal del apiario
  const [apiarioSeleccionado, setApiarioSeleccionado] = useState<{ id: string; name: string } | null>(null);
  const [historialApiario, setHistorialApiario] = useState<HistorialApiario | null>(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const cerrarFichaApiario = () => {
    setApiarioSeleccionado(null);
    setHistorialApiario(null);
  };

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

  useEffect(() => {
    async function loadMaps() {
      try {
        const markers: MapMarker[] = [];

        // 1. Apiarios propios
        const { data: apiarios } = await supabase.from('apiarios').select('id, name, lat, lng, details');
        const { data: colmenas } = await supabase
          .from('colmenas')
          .select('id, apiario_id, alzas')
          .gte('alzas', 2);

        const apiariosAltaProd = new Set<string>();
        colmenas?.forEach((c: Record<string, unknown>) => {
          if (c.apiario_id) apiariosAltaProd.add(String(c.apiario_id));
        });

        apiarios?.forEach((a: Record<string, unknown>) => {
          if (a.lat != null && a.lng != null) {
            const apiId = String(a.id);
            const isAlta = apiariosAltaProd.has(apiId);
            markers.push({
              id: `api-${apiId}`,
              lat: Number(a.lat),
              lng: Number(a.lng),
              type: isAlta ? 'alta_produccion' : 'obrera',
              domain: 'territorio',
              name: String(a.name ?? 'Apiario Propio'),
              details: isAlta
                ? `${a.details ? `${String(a.details)} | ` : ''}Contiene Súper-Colmenas (+2 alzas)`
                : (a.details ? String(a.details) : undefined),
            });
          }
        });

        // 2. Bosque nativo / regeneración
        const arbolesRes = await apiFetch('/api/produccion/arboles/map');
        const arbolesJson = arbolesRes.ok ? await arbolesRes.json() : { data: [] };
        const arboles = arbolesJson.data ?? [];
        arboles.forEach((t: Record<string, unknown>) => {
          if (t.lat != null && t.lng != null) {
            markers.push({
              id: `tree-${String(t.id)}`,
              lat: Number(t.lat),
              lng: Number(t.lng),
              type: 'tree',
              domain: 'territorio',
              name: String(t.especie ?? 'Árbol nativo'),
              details: 'Bosque nativo regenerado',
            });
          }
        });

        // 3. Tienda (obrerayzangano.cl): Puntos de Venta B2B (Cafeterías, Tiendas Gourmet, Hoteles)
        const { data: puntosVenta } = await supabase
          .from('b2b_puntos_venta')
          .select('id, nombre, tipo, ciudad, estado, contacto_nombre, notas');

        puntosVenta?.forEach((pv: Record<string, unknown>, idx: number) => {
          const ciudad = pv.ciudad ? String(pv.ciudad) : null;
          const notas = pv.notas ? String(pv.notas) : null;
          const coords = resolveClienteCoords(notas, ciudad, String(pv.nombre ?? '')) || (ciudad ? resolveComunaCoords(ciudad) : null);
          if (!coords) return;

          const tipo = String(pv.tipo || 'otro');
          let mType: MapMarker['type'] = 'tienda_gourmet';
          if (tipo === 'cafeteria') mType = 'cafeteria';
          else if (tipo === 'hotel') mType = 'hotel';
          else if (tipo === 'tienda_gourmet') mType = 'tienda_gourmet';
          else if (tipo === 'feria_evento') mType = 'feria';

          const jitterLat = ((idx * 17) % 7 - 3) * 0.006;
          const jitterLng = ((idx * 23) % 7 - 3) * 0.006;

          markers.push({
            id: `pv-${String(pv.id)}`,
            lat: coords.lat + jitterLat,
            lng: coords.lng + jitterLng,
            type: mType,
            domain: mType === 'feria' ? 'campo' : 'tienda',
            name: String(pv.nombre ?? 'Punto de Venta'),
            details: `${getMarkerTypeLabel(mType)}${ciudad ? ` · ${ciudad}` : ''} · Estado: ${String(pv.estado || 'activo')}`,
            ciudad: ciudad ?? undefined,
            segmento: tipo,
          });
        });

        // 4. Tienda: Clientes B2B / Mayoristas
        const { data: clientesRetail } = await supabase
          .from('clientes')
          .select('id, name, type, status, total_spent, notes')
          .in('type', ['B2B', 'Retail', 'Gourmet', 'Exportación'])
          .in('status', ['activo', 'frecuente']);

        clientesRetail?.forEach((cl: Record<string, unknown>, idx: number) => {
          const notas = cl.notes ? String(cl.notes) : null;
          const coords = resolveClienteCoords(notas, null, String(cl.name ?? ''));
          if (!coords) return;
          const spent = Number(cl.total_spent) || 0;
          const jitterLat = ((idx * 19) % 7 - 3) * 0.005;
          const jitterLng = ((idx * 31) % 7 - 3) * 0.005;

          markers.push({
            id: `cli-${String(cl.id)}`,
            lat: coords.lat + jitterLat,
            lng: coords.lng + jitterLng,
            type: 'cliente_b2b',
            domain: 'tienda',
            name: String(cl.name ?? 'Cliente Mayorista'),
            details: spent > 0 ? `Cliente activo · ${formatCLP(Math.round(spent))}` : 'Cliente B2B',
            segmento: String(cl.type ?? 'B2B'),
          });
        });

        // 5. Tienda: Envíos en Tránsito
        const { data: ventasTransito } = await supabase
          .from('ventas')
          .select('id, direccion_envio, productos')
          .in('estado', ['en_transito', 'En tránsito']);

        ventasTransito?.forEach((v: Record<string, unknown>, idx: number) => {
          if (v.direccion_envio) {
            const dirObj = typeof v.direccion_envio === 'string' ? JSON.parse(v.direccion_envio) : v.direccion_envio;
            const region = dirObj?.region || '';
            const ciudad = dirObj?.ciudad || dirObj?.comuna || '';
            const coords = resolveClienteCoords(region, ciudad, '') || (ciudad ? resolveComunaCoords(ciudad) : null);
            if (coords) {
              const jitterLat = ((idx * 11) % 5 - 2) * 0.015;
              const jitterLng = ((idx * 29) % 5 - 2) * 0.015;
              markers.push({
                id: `transito-${String(v.id)}`,
                lat: coords.lat + jitterLat,
                lng: coords.lng + jitterLng,
                type: 'transito',
                domain: 'tienda',
                name: `Pedido en ruta (${ciudad || 'Chile'})`,
                details: 'En camino al destinatario',
                ciudad: ciudad || undefined,
              });
            }
          }
        });

        // 6. Campo: Ferias y Eventos de venta en terreno
        const { data: participanteEventos } = await supabase
          .from('participante_evento')
          .select('id, nombre_evento, ubicacion, fecha_inicio, fecha_fin, estado');

        participanteEventos?.forEach((pe: Record<string, unknown>, idx: number) => {
          const ubicacion = pe.ubicacion ? String(pe.ubicacion) : null;
          const coords = (ubicacion ? resolveComunaCoords(ubicacion) : null) || resolveClienteCoords(null, ubicacion, String(pe.nombre_evento ?? ''));
          if (!coords) return;

          const jitterLat = ((idx * 13) % 5 - 2) * 0.005;
          const jitterLng = ((idx * 23) % 5 - 2) * 0.005;

          markers.push({
            id: `pevent-${String(pe.id)}`,
            lat: coords.lat + jitterLat,
            lng: coords.lng + jitterLng,
            type: 'feria',
            domain: 'campo',
            name: String(pe.nombre_evento ?? 'Feria / Stand de Campo'),
            details: `Presencia en terreno${ubicacion ? ` · ${ubicacion}` : ''} · Estado: ${String(pe.estado || 'activo')}`,
            ciudad: ubicacion ?? undefined,
            segmento: 'feria',
          });
        });

        const { data: evts } = await supabase
          .from('eventos')
          .select('id, nombre, fecha_inicio, lat, lng');

        evts?.forEach((e: Record<string, unknown>) => {
          if (e.lat != null && e.lng != null) {
            markers.push({
              id: `feria-${String(e.id)}`,
              lat: Number(e.lat),
              lng: Number(e.lng),
              type: 'feria',
              domain: 'campo',
              name: String(e.nombre ?? 'Feria / Evento'),
              details: e.fecha_inicio ? `Fecha: ${String(e.fecha_inicio)}` : undefined,
              segmento: 'feria',
            });
          }
        });

        // 7. Campo: Revendedores
        const { data: revendedores } = await supabase
          .from('b2b_revendedores')
          .select('id, nombre, tipo_espacio, estado, notas');

        revendedores?.forEach((rev: Record<string, unknown>, idx: number) => {
          const notas = rev.notas ? String(rev.notas) : null;
          const coords = resolveClienteCoords(notas, null, String(rev.nombre ?? ''));
          if (!coords) return;

          const jitterLat = ((idx * 7) % 5 - 2) * 0.005;
          const jitterLng = ((idx * 17) % 5 - 2) * 0.005;

          markers.push({
            id: `rev-${String(rev.id)}`,
            lat: coords.lat + jitterLat,
            lng: coords.lng + jitterLng,
            type: 'revendedor',
            domain: 'campo',
            name: String(rev.nombre ?? 'Revendedor Autorizado'),
            details: `Espacio: ${String(rev.tipo_espacio || 'espacio propio')} · Estado: ${String(rev.estado || 'activo')}`,
            segmento: 'revendedor',
          });
        });

        // 8. Registro Territorial (Chiloé) — Catastro reservado para el fundador
        const [alertasRes, trashumRes, prediosRes, censoRes] = await Promise.all([
          apiFetch('/api/registro-territorial/alertas'),
          apiFetch('/api/registro-territorial/apiarios-externos'),
          apiFetch('/api/registro-territorial/predios'),
          apiFetch('/api/mapa/censo-detallado'),
        ]);
        const alertasJson = alertasRes.ok ? await alertasRes.json() : { data: [] };
        const trashumJson = trashumRes.ok ? await trashumRes.json() : { data: [] };
        const prediosJson = prediosRes.ok ? await prediosRes.json() : { data: [] };
        const censoJson = censoRes.ok ? await censoRes.json() : { data: [] };
        setAlertas(alertasJson.data ?? []);
        setTrashumantes(trashumJson.data ?? []);
        setPredios(prediosJson.data ?? []);
        setCensoApiarios(censoJson.data ?? []);

        // Recolecciones con geolocalización
        const { data: cosechasGeo } = await supabase
          .from('cosechas')
          .select('id, fecha, kg, floracion, colmenas(apiarios(id, name, lat, lng))')
          .not('fecha', 'is', null)
          .order('fecha', { ascending: false })
          .limit(500);
        setCosechasMapa(cosechasGeo ?? []);

        setLiveMarkers(markers);
      } catch (err) {
        toast(friendlyError(err, 'Error al cargar datos del mapa'), { type: 'error' });
      }
    }
    loadMaps();
  }, [apiFetch]);

  const handleMapClick = (lat: number, lng: number) => {
    if (!isEditMode) return;
    cerrarFichaApiario();
    setNewMarkerCoords({ lat, lng });
    setShowAddModal(true);
  };

  const handleSaveMarker = async () => {
    if (!newMarkerCoords || !newMarkerForm.name) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast('Sesión requerida para registrar marcadores', { type: 'error' });
      return;
    }

    try {
      const { type, name, details, ciudad, fecha_inicio } = newMarkerForm;
      const { lat, lng } = newMarkerCoords;

      if (type === 'obrera') {
        const { data: newApiario, error } = await supabase.from('apiarios').insert({
          name,
          lat,
          lng,
          details: details || null,
          user_id: user.id,
        }).select().single();
        if (error) throw error;

        if (newApiario) {
          setLiveMarkers((prev) => [...prev, {
            id: `api-${String(newApiario.id)}`,
            lat,
            lng,
            type: 'obrera',
            domain: 'territorio',
            name,
            details: details || undefined,
          }]);
        }
      } else if (type === 'tree') {
        const res = await apiFetch('/api/produccion/arboles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            especie: name,
            cantidad: 1,
            sector: details || 'Mapa territorial',
            lat,
            lng,
          }),
        });
        if (!res.ok) throw new Error('No se pudo registrar el árbol');
        const json = await res.json();
        const newArbol = json.data;
        if (newArbol?.id) {
          setLiveMarkers((prev) => [...prev, {
            id: `tree-${String(newArbol.id)}`,
            lat,
            lng,
            type: 'tree',
            domain: 'territorio',
            name,
            details: 'Bosque nativo regenerado',
          }]);
        }
      } else if (type === 'feria') {
        const { data: newEvt, error } = await supabase.from('eventos').insert({
          nombre: name,
          fecha_inicio: fecha_inicio || new Date().toISOString().split('T')[0],
          lat,
          lng,
        }).select().single();
        if (error) throw error;

        if (newEvt) {
          setLiveMarkers((prev) => [...prev, {
            id: `feria-${String(newEvt.id)}`,
            lat,
            lng,
            type: 'feria',
            domain: 'campo',
            name,
            details: fecha_inicio ? `Fecha: ${fecha_inicio}${details ? ` · ${details}` : ''}` : details || undefined,
            segmento: 'feria',
          }]);
        }
      } else if (type === 'cafeteria' || type === 'tienda_gourmet' || type === 'hotel') {
        const codigo = generarCodigoAcceso();
        const notasPayload = JSON.stringify({ lat, lng, detalles: details || '' });
        const { data: newPv, error } = await supabase.from('b2b_puntos_venta').insert({
          nombre: name,
          tipo: type,
          ciudad: ciudad || 'Chiloé',
          codigo_acceso: codigo,
          origen: 'marca',
          estado: 'activo',
          notas: notasPayload,
          user_id: user.id,
        }).select().single();
        if (error) throw error;

        if (newPv) {
          setLiveMarkers((prev) => [...prev, {
            id: `pv-${String(newPv.id)}`,
            lat,
            lng,
            type,
            domain: 'tienda',
            name,
            details: `${getMarkerTypeLabel(type)} · ${ciudad || 'Chiloé'} · QR: ${codigo}`,
            ciudad: ciudad || 'Chiloé',
            segmento: type,
          }]);
        }
      } else if (type === 'revendedor') {
        const codigoRev = generarCodigoAcceso();
        const notasRev = JSON.stringify({ lat, lng, detalles: details || '' });
        const { data: newRev, error } = await supabase.from('b2b_revendedores').insert({
          nombre: name,
          tipo_espacio: 'espacio_propio',
          codigo_revendedor: codigoRev,
          origen: 'marca',
          estado: 'activo',
          notas: notasRev,
          user_id: user.id,
        }).select().single();
        if (error) throw error;

        if (newRev) {
          setLiveMarkers((prev) => [...prev, {
            id: `rev-${String(newRev.id)}`,
            lat,
            lng,
            type: 'revendedor',
            domain: 'campo',
            name,
            details: `Revendedor Autorizado · QR: ${codigoRev}`,
            segmento: 'revendedor',
          }]);
        }
      }

      setShowAddModal(false);
      setNewMarkerForm({
        type: 'obrera',
        name: '',
        details: '',
        ciudad: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
      });
      setNewMarkerCoords(null);
      toast('Nuevo punto registrado exitosamente en el mapa', { type: 'success' });
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
      } else if (id.startsWith('feria-')) {
        const feriaId = id.substring(6);
        const { error } = await supabase.from('eventos').update({ lat, lng }).eq('id', feriaId);
        if (error) throw error;
      } else if (id.startsWith('pv-')) {
        const pvId = id.substring(3);
        const notasPayload = JSON.stringify({ lat, lng });
        const { error } = await supabase.from('b2b_puntos_venta').update({ notas: notasPayload }).eq('id', pvId);
        if (error) throw error;
      } else if (id.startsWith('rev-')) {
        const revId = id.substring(4);
        const notasPayload = JSON.stringify({ lat, lng });
        const { error } = await supabase.from('b2b_revendedores').update({ notas: notasPayload }).eq('id', revId);
        if (error) throw error;
      }
      toast('Ubicación del marcador actualizada', { type: 'success' });
      setLiveMarkers((prev) => prev.map((m) => (m.id === id ? { ...m, lat, lng } : m)));
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
      } else if (id.startsWith('feria-')) {
        const feriaId = id.substring(6);
        const { error } = await supabase.from('eventos').delete().eq('id', feriaId);
        if (error) throw error;
      } else if (id.startsWith('pv-')) {
        const pvId = id.substring(3);
        const { error } = await supabase.from('b2b_puntos_venta').delete().eq('id', pvId);
        if (error) throw error;
      } else if (id.startsWith('rev-')) {
        const revId = id.substring(4);
        const { error } = await supabase.from('b2b_revendedores').delete().eq('id', revId);
        if (error) throw error;
      }
      setLiveMarkers((prev) => prev.filter((m) => m.id !== id));
      toast('Marcador eliminado correctamente', { type: 'success' });
      setShowEditModal(false);
      setSelectedMarker(null);
    } catch (error) {
      toast(friendlyError(error, 'Error al eliminar marcador'), { type: 'error' });
    }
  };

  const handleUpdateMarker = async () => {
    if (!selectedMarker) return;
    try {
      const id = selectedMarker.id;
      const { name, details } = editMarkerForm;

      if (id.startsWith('api-')) {
        const apiId = id.substring(4);
        const { error } = await supabase.from('apiarios').update({
          name,
          details: details || null,
        }).eq('id', apiId);
        if (error) throw error;
      } else if (id.startsWith('tree-')) {
        const treeId = id.substring(5);
        const res = await apiFetch(`/api/produccion/arboles/${treeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ especie: name }),
        });
        if (!res.ok) throw new Error('No se pudo actualizar el árbol');
      } else if (id.startsWith('feria-')) {
        const feriaId = id.substring(6);
        const { error } = await supabase.from('eventos').update({ nombre: name }).eq('id', feriaId);
        if (error) throw error;
      } else if (id.startsWith('pv-')) {
        const pvId = id.substring(3);
        const { error } = await supabase.from('b2b_puntos_venta').update({ nombre: name }).eq('id', pvId);
        if (error) throw error;
      } else if (id.startsWith('rev-')) {
        const revId = id.substring(4);
        const { error } = await supabase.from('b2b_revendedores').update({ nombre: name }).eq('id', revId);
        if (error) throw error;
      }

      toast('Marcador actualizado correctamente', { type: 'success' });
      setLiveMarkers((prev) => prev.map((m) => (m.id === selectedMarker.id ? {
        ...m,
        name,
        details: details || undefined,
      } : m)));
      setShowEditModal(false);
      setSelectedMarker(null);
    } catch (error) {
      toast(friendlyError(error, 'Error al actualizar marcador'), { type: 'error' });
    }
  };

  // Filtrado por rol y por entorno
  let filteredMarkers = liveMarkers.filter((m) => {
    if (activeEnv === 'tienda' && m.domain !== 'tienda') return false;
    if (activeEnv === 'campo' && m.domain !== 'campo') return false;
    if (activeEnv === 'territorio' && m.domain !== 'territorio') return false;

    if (m.type === 'obrera' && !showApiarios) return false;
    if (m.type === 'alta_produccion' && !showAltaProduccion && !showApiarios) return false;
    if (m.type === 'tree' && !showTrees) return false;
    if (m.type === 'cafeteria' && !showCafeterias) return false;
    if (m.type === 'tienda_gourmet' && !showTiendasGourmet) return false;
    if (m.type === 'hotel' && !showHoteles) return false;
    if (m.type === 'cliente_b2b' && !showClientesB2B) return false;
    if (m.type === 'transito' && !showTransito) return false;
    if (m.type === 'feria' && !showFerias) return false;
    if (m.type === 'revendedor' && !showRevendedores) return false;

    return true;
  });

  if (showApiarios && !showAltaProduccion) {
    filteredMarkers = filteredMarkers.map((m) => (m.type === 'alta_produccion' ? { ...m, type: 'obrera' as const } : m));
  }

  // Timeline estacional: mes enfocado
  const fechaFocus = esAhora ? new Date() : new Date(`${fechaEnfocada}-01T12:00:00`);
  const mesInicio = new Date(fechaFocus.getFullYear(), fechaFocus.getMonth(), 1);
  const mesFin = new Date(fechaFocus.getFullYear(), fechaFocus.getMonth() + 1, 0, 23, 59, 59);

  const trashumantesVisibles = trashumantes.filter((t) => {
    if (t.lat_aproximada == null || t.lng_aproximada == null) return false;
    const ingreso = new Date(t.fecha_ingreso);
    const salida = t.fecha_salida ? new Date(t.fecha_salida) : null;
    if (esAhora) {
      return ingreso <= fechaFocus && (!salida || salida >= fechaFocus);
    }
    return ingreso <= mesFin && (!salida || salida >= mesInicio);
  });

  const alertasVisibles = alertas.filter((a) => {
    if (a.lat_aproximada == null || a.lng_aproximada == null) return false;
    const prog = new Date(a.fecha_programada);
    if (esAhora) {
      const dias = (fechaFocus.getTime() - prog.getTime()) / (1000 * 60 * 60 * 24);
      return Math.abs(dias) <= 30;
    }
    return prog >= mesInicio && prog <= mesFin;
  });

  const cosechasVisibles = cosechasMapa.filter((c) => {
    if (!c.fecha) return false;
    const f = new Date(c.fecha);
    if (esAhora) {
      return (
        f.getFullYear() === fechaFocus.getFullYear() &&
        f.getMonth() === fechaFocus.getMonth()
      );
    }
    return f >= mesInicio && f <= mesFin;
  });

  const irMes = (delta: number) => {
    const cur = esAhora ? new Date() : new Date(`${fechaEnfocada}-01T12:00:00`);
    cur.setMonth(cur.getMonth() + delta);
    setFechaEnfocada(cur.toISOString().slice(0, 7));
    setEsAhora(false);
  };

  const volverAhora = () => {
    setEsAhora(true);
    setFechaEnfocada(new Date().toISOString().slice(0, 7));
  };

  const timelineApiario = (() => {
    if (!historialApiario) return [];
    interface ItemHist { fecha: string; tipo: string; texto: string }
    const items: ItemHist[] = [];
    for (const c of historialApiario.colmenas) {
      for (const i of c.inspecciones ?? []) {
        items.push({
          fecha: i.date ?? '',
          tipo: '🔍 Inspección',
          texto: `Colmena ${c.name ?? ''}${i.fase ? ` · ${i.fase}` : ''}${i.marcos_miel ? ` · ${i.marcos_miel} marcos miel` : ''}`,
        });
      }
    }
    for (const c of historialApiario.cosechas) {
      items.push({
        fecha: c.fecha ?? '',
        tipo: '🍯 Recolección',
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

  const center: [number, number] = [-42.47, -73.73];
  const showTerritorialLayers = activeEnv === 'enjambre' || activeEnv === 'territorio';

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Map Container */}
      <div
        className="map-container relative rounded-2xl md:rounded-3xl overflow-hidden border border-border/70 shadow-2xl ring-1 ring-border/30 bg-surface-sunken"
        style={{ height, minHeight: '620px' }}
      >
        {/* Selector de Entornos (Segmentación Orgánica) */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[1000] flex flex-wrap items-center gap-1 p-1 rounded-xl bg-background/90 backdrop-blur-md border border-border/80 shadow-xl text-foreground max-w-[calc(100%-1.5rem)]">
          <button
            type="button"
            onClick={() => setActiveEnv('enjambre')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
              activeEnv === 'enjambre'
                ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised font-medium'
            }`}
          >
            <span>🏛️</span>
            <span className="font-serif tracking-wide">Modo Enjambre Legado</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-sunken/60 text-foreground font-mono">Consolidado</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveEnv('tienda')}
            className={`px-2.5 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
              activeEnv === 'tienda'
                ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised font-medium'
            }`}
          >
            <span>🛒</span>
            <span>Tienda</span>
            <span className="hidden sm:inline text-[10px] opacity-75">obrerayzangano.cl</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveEnv('campo')}
            className={`px-2.5 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
              activeEnv === 'campo'
                ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised font-medium'
            }`}
          >
            <span>⛺</span>
            <span>Campo</span>
            <span className="hidden sm:inline text-[10px] opacity-75">POS & Ferias</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveEnv('territorio')}
            className={`px-2.5 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
              activeEnv === 'territorio'
                ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised font-medium'
            }`}
          >
            <span>🌲</span>
            <span>Registro Territorial</span>
            <span className="hidden sm:inline text-[10px] opacity-75">Chiloé</span>
          </button>
        </div>

        {/* Floating Controls (Top Right) */}
        <div className="absolute top-16 sm:top-4 right-3 sm:right-4 z-[1000] flex flex-wrap items-center justify-end gap-2 max-w-[calc(100%-1.5rem)]">
          {/* Toggles Contextuales según el Entorno */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-background/90 backdrop-blur-md border border-border/80 shadow-xl text-foreground">
            {/* Tienda (obrerayzangano.cl) */}
            {(activeEnv === 'enjambre' || activeEnv === 'tienda') && (
              <>
                <button
                  type="button"
                  onClick={() => setShowCafeterias(!showCafeterias)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showCafeterias ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                  title="Cafeterías con miel a la venta"
                >
                  ☕ Cafeterías
                </button>
                <button
                  type="button"
                  onClick={() => setShowTiendasGourmet(!showTiendasGourmet)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showTiendasGourmet ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                  title="Tiendas gourmet y emporios"
                >
                  🛍️ Tiendas Gourmet
                </button>
                <button
                  type="button"
                  onClick={() => setShowHoteles(!showHoteles)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showHoteles ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                  title="Hoteles y hospedajes boutique"
                >
                  🏨 Hoteles
                </button>
                <button
                  type="button"
                  onClick={() => setShowClientesB2B(!showClientesB2B)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showClientesB2B ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                  title="Clientes mayoristas y B2B"
                >
                  💼 Clientes B2B
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransito(!showTransito)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showTransito ? 'bg-info text-info-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                  title="Envíos de la tienda online en tránsito"
                >
                  📦 En Tránsito
                </button>
              </>
            )}

            {/* Campo (POS & Ferias) */}
            {(activeEnv === 'enjambre' || activeEnv === 'campo') && (
              <>
                <button
                  type="button"
                  onClick={() => setShowFerias(!showFerias)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showFerias ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                  title="Ferias y eventos de venta en terreno"
                >
                  🎪 Ferias
                </button>
                <button
                  type="button"
                  onClick={() => setShowRevendedores(!showRevendedores)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showRevendedores ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                  title="Revendedores en terreno"
                >
                  🤝 Revendedores
                </button>
              </>
            )}

            {/* Territorio (Chiloé & Apiarios Propios) */}
            {(activeEnv === 'enjambre' || activeEnv === 'territorio') && (
              <>
                <button
                  type="button"
                  onClick={() => setShowApiarios(!showApiarios)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showApiarios ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                >
                  🐝 Apiarios
                </button>
                <button
                  type="button"
                  onClick={() => setShowAltaProduccion(!showAltaProduccion)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showAltaProduccion ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                >
                  🌟 Alta Producción
                </button>
                <button
                  type="button"
                  onClick={() => setShowTrees(!showTrees)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showTrees ? 'bg-success text-success-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                >
                  🌳 Árboles
                </button>
                <button
                  type="button"
                  onClick={() => setShowAlertas(!showAlertas)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showAlertas ? 'bg-destructive text-destructive-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                >
                  ⚠️ Alertas
                </button>
                <button
                  type="button"
                  onClick={() => setShowTrashumantes(!showTrashumantes)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showTrashumantes ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                >
                  🚚 Trashumantes
                </button>
                <button
                  type="button"
                  onClick={() => setShowPredios(!showPredios)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showPredios ? 'bg-success text-success-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                >
                  🌿 Predios
                </button>
                <button
                  type="button"
                  onClick={() => setShowCensoApiarios(!showCensoApiarios)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showCensoApiarios ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                >
                  🐝 Censo
                </button>
                <button
                  type="button"
                  onClick={() => setShowCosechas(!showCosechas)}
                  className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    showCosechas ? 'bg-warning text-warning-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                >
                  🍯 Recolecciones
                </button>
              </>
            )}
          </div>

          {/* Selector de Mes Estacional */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-background/90 backdrop-blur-md border border-border/80 shadow-xl text-foreground">
            <button
              type="button"
              onClick={() => irMes(-1)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft size={14} />
            </button>
            {esAhora ? (
              <button
                type="button"
                onClick={volverAhora}
                className="px-2.5 py-1 text-xs rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-1 shadow-sm"
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
                className="px-2 py-0.5 text-xs bg-transparent border-none text-foreground font-medium w-[115px] focus:outline-none"
              />
            )}
            <button
              type="button"
              onClick={() => irMes(1)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Estilo Satélite / Oscuro & Modo Edición */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-background/90 backdrop-blur-md border border-border/80 shadow-xl text-foreground">
            <button
              type="button"
              onClick={() => setMapStyle(mapStyle === 'satellite' ? 'dark' : 'satellite')}
              className="px-2.5 py-1 text-xs rounded-lg font-medium text-foreground hover:bg-surface-raised transition-colors flex items-center gap-1.5"
              title={mapStyle === 'satellite' ? 'Cambiar a mapa oscuro' : 'Cambiar a satélite'}
            >
              {mapStyle === 'satellite' ? <Moon size={14} /> : <Sun size={14} />}
              <span className="hidden sm:inline">{mapStyle === 'satellite' ? 'Satélite' : 'Oscuro'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                isEditMode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
              }`}
            >
              <MapPin size={14} />
              <span className="hidden sm:inline">{isEditMode ? 'Modo Edición ON' : 'Modo Edición'}</span>
            </button>

            {isEditMode && (
              <button
                type="button"
                onClick={() => {
                  setNewMarkerCoords({ lat: -42.47, lng: -73.73 });
                  setShowAddModal(true);
                }}
                className="px-2 py-1 text-xs rounded-lg font-medium bg-accent text-accent-foreground hover:brightness-110 transition-all flex items-center gap-1"
                title="Plantar pin en el mapa"
              >
                <Plus size={13} />
                <span className="hidden md:inline">Plantar Pin</span>
              </button>
            )}
          </div>
        </div>

        {/* Leaflet Map */}
        <MapContainer
          center={center}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          attributionControl={false}
        >
          {mapStyle === 'satellite' ? <EsriSatelliteTileLayers /> : <DarkCartoTileLayer />}
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
                },
              }}
            >
              <Popup>
                <div style={{ minWidth: 190 }}>
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
                          cerrarFichaApiario();
                          setSelectedMarker(marker);
                          setEditMarkerForm({
                            name: marker.name,
                            details: marker.details || '',
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

          {/* Capas Territoriales (solo en Modo Enjambre Legado o Registro Territorial) */}
          {showTerritorialLayers && !filterRole && showCosechas && cosechasVisibles.map((c) => {
            const api = c.colmenas?.apiarios;
            if (api?.lat == null || api?.lng == null) return null;
            return (
              <Marker key={`cosecha-${c.id}`} position={[api.lat, api.lng]} icon={ICON_COSECHA}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>🍯 Recolección</div>
                    <strong style={{ fontSize: '0.95rem', color: BOSQUE_ULMO }}>{c.kg != null ? `${c.kg} kg` : 'Recolección'}</strong>
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

          {showTerritorialLayers && !filterRole && showAlertas && alertasVisibles.map((a) => {
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

          {showTerritorialLayers && !filterRole && showTrashumantes && trashumantesVisibles.map((t) => {
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
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}

          {showTerritorialLayers && !filterRole && showPredios && predios
            .filter((p) => p.activo && p.lat_aproximada != null && p.lng_aproximada != null)
            .map((p) => (
              <Marker key={`predio-${p.id}`} position={[p.lat_aproximada as number, p.lng_aproximada as number]} icon={ICON_PREDIO}>
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

          {showTerritorialLayers && !filterRole && showCensoApiarios && censoApiarios
            .filter((a) => a.activo && a.lat_aproximada != null && a.lng_aproximada != null)
            .map((a) => {
              const telLimpio = a.telefono ? a.telefono.replace(/[^0-9+]/g, '') : '';
              const telWa = telLimpio.startsWith('+') ? telLimpio.slice(1) : telLimpio.startsWith('56') ? telLimpio : `56${telLimpio}`;
              const waText = encodeURIComponent(
                `Hola ${a.titular || 'estimado apicultor'}, te contacto desde la dirección de Enjambre Legado. Quisiéramos consultar disponibilidad de miel de tu apiario ${a.nombre || ''} en ${a.comuna} para una eventual compra directa de microlote.`
              );

              return (
                <Marker key={`censo-${a.id}`} position={[a.lat_aproximada as number, a.lng_aproximada as number]} icon={ICON_CENSO}>
                  <Popup autoPan={true} autoPanPadding={[50, 50]}>
                    <div className="p-1 min-w-[260px] max-w-[300px] space-y-2 text-xs">
                      {/* Cabecera */}
                      <div className="border-b border-border/60 pb-1.5">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
                            🐝 Reserva Territorial · {a.comuna}
                          </span>
                          {a.nivel_acreditacion && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                              {a.nivel_acreditacion}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-foreground leading-tight">
                          {a.nombre ?? 'Apiario comunal'}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {a.zona ? `${a.zona} · ` : ''}{a.comuna}
                        </p>
                      </div>

                      {/* Identidad del Productor */}
                      <div className="bg-surface-sunken/80 rounded-lg p-2 border border-border/50 space-y-1 text-[11px]">
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Titular:</span>
                          <strong className="text-foreground text-right">{a.titular || 'No declarado'}</strong>
                        </p>
                        {a.rut && (
                          <p className="flex justify-between">
                            <span className="text-muted-foreground">RUT:</span>
                            <span className="font-mono text-foreground">{a.rut}</span>
                          </p>
                        )}
                        {a.rup && (
                          <p className="flex justify-between">
                            <span className="text-muted-foreground">RUP SAG:</span>
                            <span className="font-mono text-foreground font-semibold">{a.rup}</span>
                          </p>
                        )}
                      </div>

                      {/* Biología y Sanidad */}
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Colmenas declaradas:</span>
                          <span className="font-bold text-foreground font-mono tabular-nums">{a.n_colmenas} ({a.categoria})</span>
                        </div>
                        {a.metodo_control_varroa && (
                          <p className="text-muted-foreground text-[10px] leading-tight">
                            <strong className="text-foreground">Control Varroa:</strong> {a.metodo_control_varroa}
                          </p>
                        )}
                        {a.practicas_sanitarias && (
                          <p className="text-muted-foreground text-[10px] leading-tight truncate">
                            <strong className="text-foreground">Sanidad:</strong> {a.practicas_sanitarias}
                          </p>
                        )}
                      </div>

                      {/* Contacto Directo para Abastecimiento / Compra de Miel */}
                      <div className="pt-2 border-t border-border/60 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                          Abastecimiento & Compra Directa:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {a.telefono && (
                            <>
                              <a
                                href={`tel:${telLimpio}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-raised border border-border text-[11px] font-medium text-foreground hover:bg-surface-sunken transition-colors"
                              >
                                📞 Llamar
                              </a>
                              <a
                                href={`https://wa.me/${telWa}?text=${waText}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/15 border border-emerald-600/30 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/25 transition-colors"
                              >
                                💬 WhatsApp
                              </a>
                            </>
                          )}
                          {a.email && (
                            <a
                              href={`mailto:${a.email}?subject=${encodeURIComponent(`Enjambre Legado - Consulta Miel Apiario ${a.nombre || ''}`)}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-raised border border-border text-[11px] font-medium text-foreground hover:bg-surface-sunken transition-colors"
                            >
                              ✉️ Email
                            </a>
                          )}
                          {!a.telefono && !a.email && (
                            <span className="text-[10px] text-muted-foreground italic">
                              Sin datos de contacto directo aún
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>

      {/* Ficha Lateral del Apiario Propio */}
      {apiarioSeleccionado && (
        <>
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[1100] transition-opacity"
            onClick={cerrarFichaApiario}
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-[1110] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-raised">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-primary">Ficha del Apiario Propio</span>
                <h3 className="font-serif text-lg text-foreground font-semibold">{apiarioSeleccionado.name}</h3>
              </div>
              <button
                type="button"
                onClick={cerrarFichaApiario}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-sunken"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingHistorial ? (
                <div className="text-center py-10 text-muted-foreground text-sm">Cargando bitácora del apiario...</div>
              ) : historialApiario ? (
                <>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-surface-sunken border border-border">
                      <span className="text-muted-foreground block text-[10px]">Colmenas</span>
                      <strong className="text-sm text-foreground">{historialApiario.colmenas.length}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-sunken border border-border">
                      <span className="text-muted-foreground block text-[10px]">Recolecciones</span>
                      <strong className="text-sm text-foreground">
                        {historialApiario.cosechas.reduce((acc, c) => acc + (c.kg || 0), 0)} kg
                      </strong>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Línea de Vida</h4>
                    <div className="space-y-2 text-xs">
                      {timelineApiario.length === 0 ? (
                        <p className="text-muted-foreground text-xs py-2">Sin registros en este apiario.</p>
                      ) : (
                        timelineApiario.map((item, i) => (
                          <div key={i} className="p-2 rounded-lg bg-surface-sunken border border-border flex flex-col gap-0.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-medium text-primary">{item.tipo}</span>
                              <span className="text-muted-foreground text-[10px]">{item.fecha}</span>
                            </div>
                            <span className="text-foreground">{item.texto}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </>
      )}

      {/* Modal Agregar Marcador Enriquecido (Eventos, Puntos de Venta, Apiarios, etc.) */}
      <ImmersiveModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        size="md"
        eyebrow="Plantar en el Mapa"
        title="Nuevo Pin o Evento Territorial"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveMarker}>
              Guardar en el Mapa
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {newMarkerCoords && (
            <div className="p-2 rounded-lg bg-surface-sunken border border-border text-[11px] font-mono text-muted-foreground flex items-center justify-between">
              <span>Coordenadas exactas:</span>
              <span className="text-primary">{newMarkerCoords.lat.toFixed(4)}, {newMarkerCoords.lng.toFixed(4)}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Tipo de Elemento</label>
            <select
              className="input-field w-full"
              value={newMarkerForm.type}
              onChange={(e) => setNewMarkerForm({
                ...newMarkerForm,
                type: e.target.value as 'obrera' | 'tree' | 'feria' | 'cafeteria' | 'tienda_gourmet' | 'hotel' | 'revendedor',
              })}
            >
              <optgroup label="Campo (POS & Terreno)">
                <option value="feria">🎪 Feria o Evento Comercial</option>
                <option value="revendedor">🤝 Revendedor Autorizado en Terreno</option>
              </optgroup>
              <optgroup label="Tienda (obrerayzangano.cl / Alianzas)">
                <option value="cafeteria">☕ Cafetería con Miel</option>
                <option value="tienda_gourmet">🛍️ Tienda Gourmet / Emporio</option>
                <option value="hotel">🏨 Hotel / Hospedaje Boutique</option>
              </optgroup>
              <optgroup label="Territorio (Chiloé)">
                <option value="obrera">🐝 Apiario Propio</option>
                <option value="tree">🌳 Bosque Regenerado (Árbol Nativo)</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Nombre</label>
            <input
              className="input-field w-full"
              value={newMarkerForm.name}
              onChange={(e) => setNewMarkerForm({ ...newMarkerForm, name: e.target.value })}
              placeholder={
                newMarkerForm.type === 'feria'
                  ? 'Ej. Feria Costumbrista Dalcahue, Expo Gourmet...'
                  : newMarkerForm.type === 'cafeteria'
                  ? 'Ej. Café del Bosque, Tostaduría Nativa...'
                  : newMarkerForm.type === 'tienda_gourmet'
                  ? 'Ej. Emporio Chiloé, Tienda de Origen...'
                  : newMarkerForm.type === 'hotel'
                  ? 'Ej. Hotel Tierra Chiloé, Refugio Nativo...'
                  : newMarkerForm.type === 'revendedor'
                  ? 'Ej. Alianza Frutería El Canelo, Espacio Propio...'
                  : newMarkerForm.type === 'tree'
                  ? 'Ej. Ulmo Centenario, Tiaca...'
                  : 'Ej. Apiario Pureo, Apiario Quinchao...'
              }
            />
          </div>

          {newMarkerForm.type === 'feria' && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Fecha del Evento</label>
              <input
                type="date"
                className="input-field w-full"
                value={newMarkerForm.fecha_inicio}
                onChange={(e) => setNewMarkerForm({ ...newMarkerForm, fecha_inicio: e.target.value })}
              />
            </div>
          )}

          {(newMarkerForm.type === 'cafeteria' || newMarkerForm.type === 'tienda_gourmet' || newMarkerForm.type === 'hotel') && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Ciudad o Localidad</label>
              <input
                className="input-field w-full"
                value={newMarkerForm.ciudad}
                onChange={(e) => setNewMarkerForm({ ...newMarkerForm, ciudad: e.target.value })}
                placeholder="Ej. Castro, Ancud, Puerto Varas, Santiago..."
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Detalles / Notas Operativas</label>
            <textarea
              className="input-field w-full"
              rows={2}
              value={newMarkerForm.details}
              onChange={(e) => setNewMarkerForm({ ...newMarkerForm, details: e.target.value })}
              placeholder="Información sobre la presencia de miel, acuerdos comerciales o condiciones del terreno..."
            />
          </div>
        </div>
      </ImmersiveModal>

      {/* Modal Editar Marcador */}
      <ImmersiveModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        size="md"
        eyebrow="Mapa Territorial"
        title="Editar Punto"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleUpdateMarker}>
              Guardar Cambios
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Nombre</label>
            <input
              className="input-field w-full"
              value={editMarkerForm.name}
              onChange={(e) => setEditMarkerForm({ ...editMarkerForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Detalles / Notas</label>
            <textarea
              className="input-field w-full"
              rows={2}
              value={editMarkerForm.details}
              onChange={(e) => setEditMarkerForm({ ...editMarkerForm, details: e.target.value })}
            />
          </div>
        </div>
      </ImmersiveModal>

      {/* Leyenda Orgánica Integrada */}
      <div className="p-3.5 border border-border bg-card/90 backdrop-blur-sm rounded-2xl shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span style={{
              width: 14, height: 14, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
              background: `linear-gradient(135deg, ${ORO_MIEL}, ${ORO_MIEL_DARK})`, display: 'inline-block', border: `2px solid ${SALUD_OPTIMA}`
            }} /> <span className="text-foreground font-medium">Apiario propio</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center text-[9px] leading-none text-accent-foreground shadow-sm">🌟</span> <span className="text-foreground font-medium">Alta producción (+2 alzas)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-warning flex items-center justify-center text-[9px] leading-none text-warning-foreground shadow-sm">☕</span> <span className="text-foreground font-medium">Cafeterías</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center text-[9px] leading-none text-accent-foreground shadow-sm">🛍️</span> <span className="text-foreground font-medium">Tiendas Gourmet / Emporios</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-surface-raised border border-accent flex items-center justify-center text-[9px] leading-none shadow-sm">🏨</span> <span className="text-foreground font-medium">Hoteles</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center text-[9px] leading-none text-primary-foreground shadow-sm">💼</span> <span className="text-foreground font-medium">Clientes B2B</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-info flex items-center justify-center text-[9px] leading-none text-info-foreground shadow-sm">📦</span> <span className="text-foreground font-medium">Envíos en tránsito</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-destructive flex items-center justify-center text-[9px] leading-none text-destructive-foreground shadow-sm">🎪</span> <span className="text-foreground font-medium">Ferias y Stands</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center text-[9px] leading-none text-accent-foreground shadow-sm">🤝</span> <span className="text-foreground font-medium">Revendedores</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-success flex items-center justify-center text-[9px] leading-none text-success-foreground shadow-sm">🌳</span> <span className="text-foreground font-medium">Bosque regenerado</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-warning flex items-center justify-center text-[9px] leading-none text-warning-foreground shadow-sm">🍯</span> <span className="text-foreground font-medium">Recolección del mes</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-destructive flex items-center justify-center text-[9px] leading-none text-destructive-foreground shadow-sm">⚠️</span> <span className="text-foreground font-medium">Alertas fitosanitarias</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center text-[9px] leading-none text-accent-foreground shadow-sm">🚚</span> <span className="text-foreground font-medium">Trashumantes</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-success flex items-center justify-center text-[9px] leading-none text-success-foreground shadow-sm">🌿</span> <span className="text-foreground font-medium">Predios facilitadores</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center text-[9px] leading-none text-primary-foreground shadow-sm">🐝</span> <span className="text-foreground font-medium">Censo comunal</span>
          </span>
        </div>
      </div>

      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: hsl(var(--card) / 0.95) !important;
          backdrop-filter: blur(12px) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border) / 0.8) !important;
          border-radius: 1rem !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5) !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          background: hsl(var(--card) / 0.95) !important;
          border: 1px solid hsl(var(--border) / 0.8) !important;
        }
        .leaflet-popup-content {
          margin: 12px 14px !important;
          line-height: 1.5 !important;
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: hsl(var(--muted-foreground)) !important;
          padding: 6px 8px !important;
        }
      `}</style>
    </div>
  );
}
