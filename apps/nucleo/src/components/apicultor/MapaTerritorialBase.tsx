'use client';

import { useState, useMemo, useEffect } from 'react';
import { MapContainer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, Badge, Button } from '@enjambre/ui';
import { useAuthStore } from '@enjambre/auth';
import { Shield, Users, Eye, Navigation, Layers, Compass } from 'lucide-react';
import { MapResizeWatcher } from '@/components/map/MapResizeWatcher';
import { MapGestureOverlay, useMapGestureLock } from '@/components/map/MapGestureLock';
import {
  EsriSatelliteTileLayers,
  createMapBadgeIcon,
  fixLeafletDefaultIcons,
} from '@/components/map/MapLayers';

fixLeafletDefaultIcons();

const ICON_RESIDENTE = createMapBadgeIcon('hsl(145 63% 42%)', '🐝', 28);
const ICON_TRASHUMANTE = createMapBadgeIcon('hsl(44 85% 46%)', '🚚', 28);
const ICON_ALERTA = createMapBadgeIcon('hsl(0 72% 51%)', '⚠️', 28);

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
  actores_registro: { nombre_actor: string; rup?: string };
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
  /** Apiarios declarados en el censo del registro (RLS: propios + comunitarios consentidos). */
  apiariosRegistro?: ApiarioRegistroResumen[];
}

const CHILOE_COMUNAS_VIEW = [
  { id: 'todo', label: 'Archipiélago', center: [-42.48, -73.76] as [number, number], zoom: 9 },
  { id: 'ancud', label: 'Ancud', center: [-41.87, -73.83] as [number, number], zoom: 11 },
  { id: 'quemchi', label: 'Quemchi', center: [-42.14, -73.48] as [number, number], zoom: 11 },
  { id: 'dalcahue', label: 'Dalcahue', center: [-42.38, -73.65] as [number, number], zoom: 12 },
  { id: 'curaco', label: 'Curaco de Vélez', center: [-42.44, -73.60] as [number, number], zoom: 12 },
  { id: 'castro', label: 'Castro', center: [-42.48, -73.77] as [number, number], zoom: 12 },
  { id: 'quinchao', label: 'Quinchao', center: [-42.47, -73.50] as [number, number], zoom: 11 },
  { id: 'puqueldon', label: 'Puqueldón', center: [-42.59, -73.65] as [number, number], zoom: 12 },
  { id: 'chonchi', label: 'Chonchi', center: [-42.62, -73.77] as [number, number], zoom: 11 },
  { id: 'queilen', label: 'Queilén', center: [-42.89, -73.47] as [number, number], zoom: 11 },
  { id: 'quellon', label: 'Quellón', center: [-43.12, -73.61] as [number, number], zoom: 11 },
] as const;

function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.0, easeLinearity: 0.25 });
  }, [center, zoom, map]);
  return null;
}

export function MapaTerritorial({
  actores,
  alertas,
  apiariosExternos = [],
  apiariosRegistro = [],
}: MapaTerritorialProps) {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const [comunaSeleccionada, setComunaSeleccionada] = useState<string>('todo');
  const [capaSeleccionada, setCapaSeleccionada] = useState<'publica' | 'comunitaria' | 'restringida'>('comunitaria');
  const capaActiva: 'publica' | 'comunitaria' | 'restringida' =
    capaSeleccionada === 'restringida' && !isAdmin ? 'comunitaria' : capaSeleccionada;
  const [mostrarLeyenda, setMostrarLeyenda] = useState(true);
  const mapGestures = useMapGestureLock();

  const currentView = useMemo(() => {
    return (
      CHILOE_COMUNAS_VIEW.find((c) => c.id === comunaSeleccionada) ??
      CHILOE_COMUNAS_VIEW[0]
    );
  }, [comunaSeleccionada]);

  const totalAsentamientos = apiariosRegistro.length + apiariosExternos.length;
  const totalActores = actores.length;
  const alertasActivas = alertas.filter((a) => a.estado === 'activa');

  return (
    <Card className="bg-card border-border overflow-hidden rounded-2xl relative shadow-md">
      {/* Dock Táctico Flotante Superior */}
      <div className="p-3 sm:p-4 border-b border-border bg-surface-sunken/90 backdrop-blur-md flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Selector de Comuna */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 lg:pb-0 scrollbar-none text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1 mr-1 shrink-0">
              <Compass className="w-3.5 h-3.5 text-primary" />
              Sectores:
            </span>
            {CHILOE_COMUNAS_VIEW.map((com) => {
              const isSelected = comunaSeleccionada === com.id;
              return (
                <button
                  key={com.id}
                  onClick={() => setComunaSeleccionada(com.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'bg-background hover:bg-surface-raised text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  {com.label}
                </button>
              );
            })}
          </div>

          {/* Selector de Capas */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
            <div className="flex bg-background border border-border rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setCapaSeleccionada('publica')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  capaActiva === 'publica'
                    ? 'bg-surface-raised text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista pública: solo halos aproximados de pecoreo"
              >
                <Eye className="w-3.5 h-3.5" />
                Pública
              </button>
              <button
                onClick={() => setCapaSeleccionada('comunitaria')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  capaActiva === 'comunitaria'
                    ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista comunitaria: densidad de red y alertas fitosanitarias"
              >
                <Users className="w-3.5 h-3.5" />
                Comunitaria
              </button>
              {isAdmin && (
                <button
                  onClick={() => setCapaSeleccionada('restringida')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                    capaActiva === 'restringida'
                      ? 'bg-destructive/15 text-destructive font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Vista restringida / dirección del registro"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Restringida
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Telemetría rápida del territorio */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-mono tracking-tight bg-background/60">
              {totalAsentamientos} asentamientos en red
            </Badge>
            <Badge variant="outline" className="text-[11px] font-mono tracking-tight bg-background/60">
              {totalActores} apicultores censados
            </Badge>
            {alertasActivas.length > 0 && (
              <Badge variant="destructive" className="text-[11px] font-mono tracking-tight">
                {alertasActivas.length} alerta(s) fitosanitaria(s)
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Protección de pecoreo ±2.0 km · Ley 21.489
          </p>
        </div>
      </div>

      {/* Contenedor del Mapa Satelital */}
      <div className="h-[calc(var(--vh-full)-240px)] min-h-[580px] w-full relative z-0">
        <MapGestureOverlay unlocked={mapGestures.unlocked} onUnlock={mapGestures.unlock} />
        <MapContainer
          center={currentView.center}
          zoom={currentView.zoom}
          scrollWheelZoom={false}
          dragging={mapGestures.dragging}
          attributionControl={false}
          className="h-full w-full"
        >
          <EsriSatelliteTileLayers />
          <MapResizeWatcher />
          <MapViewController center={currentView.center} zoom={currentView.zoom} />

          {/* Alertas Fitosanitarias (en comunitaria y restringida) */}
          {(capaActiva === 'comunitaria' || capaActiva === 'restringida') &&
            alertasActivas
              .filter((a) => a.lat_aproximada && a.lng_aproximada)
              .map((alerta) => (
                <div key={alerta.id}>
                  <Circle
                    center={[alerta.lat_aproximada!, alerta.lng_aproximada!]}
                    radius={(alerta.radio_km || 3) * 1000}
                    pathOptions={{
                      color: 'hsl(var(--destructive))',
                      fillColor: 'hsl(var(--destructive))',
                      fillOpacity: 0.2,
                      weight: 1.5,
                      dashArray: '6, 6',
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1">
                        <p className="font-bold text-destructive mb-1 flex items-center gap-1">
                          ⚠️ Aviso Preventivo de Aplicación
                        </p>
                        <p className="font-medium text-foreground">
                          <strong>Producto:</strong> {alerta.producto}
                        </p>
                        <p className="text-muted-foreground">
                          <strong>Zona:</strong> {alerta.zona}
                        </p>
                        <p className="text-muted-foreground">
                          <strong>Fecha programada:</strong>{' '}
                          {new Date(alerta.fecha_programada).toLocaleDateString('es-CL')}
                        </p>
                        <div className="mt-2 pt-1 border-t border-border text-[11px] text-destructive">
                          Radio de resguardo fitosanitario: {alerta.radio_km || 3} km
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                  <Marker
                    position={[alerta.lat_aproximada!, alerta.lng_aproximada!]}
                    icon={ICON_ALERTA}
                  />
                </div>
              ))}

          {/* Apiarios Trashumantes Declarados */}
          {(capaActiva === 'comunitaria' || capaActiva === 'restringida') &&
            apiariosExternos
              .filter((a) => a.lat_aproximada && a.lng_aproximada)
              .map((apiario) => (
                <div key={apiario.id}>
                  <Circle
                    center={[apiario.lat_aproximada!, apiario.lng_aproximada!]}
                    radius={2000}
                    pathOptions={{
                      color: 'hsl(var(--accent))',
                      fillColor: 'hsl(var(--accent))',
                      fillOpacity: 0.15,
                      weight: 1,
                      dashArray: '4, 4',
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1">
                        <p className="font-bold text-accent mb-1 flex items-center gap-1">
                          🚚 Apiario Trashumante en Tránsito
                        </p>
                        <p className="text-muted-foreground">
                          <strong>Asentamiento temporal:</strong> Radio estimado ~2.0 km
                        </p>
                        {capaActiva === 'restringida' && (
                          <p className="text-[11px] text-muted-foreground mt-2 border-t border-border pt-1">
                            Actor: {apiario.actores_registro?.nombre_actor}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Circle>
                  {capaActiva === 'restringida' && (
                    <Marker
                      position={[apiario.lat_aproximada!, apiario.lng_aproximada!]}
                      icon={ICON_TRASHUMANTE}
                    />
                  )}
                </div>
              ))}

          {/* Apiarios de la Red Territorial (140+ Asentamientos de Chiloé) */}
          {apiariosRegistro
            .filter((a) => a.lat_aproximada != null && a.lng_aproximada != null)
            .map((apiario) => (
              <div key={apiario.id}>
                {/* Halo de Pecoreo Orgánico (K-Anonymity ~2.0 km) */}
                <Circle
                  center={[apiario.lat_aproximada!, apiario.lng_aproximada!]}
                  radius={2000}
                  pathOptions={{
                    color: 'hsl(var(--primary))',
                    fillColor: 'hsl(var(--primary))',
                    fillOpacity: capaActiva === 'publica' ? 0.08 : 0.14,
                    weight: 1,
                    dashArray: '3, 4',
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1">
                      <p className="font-bold text-primary mb-1 flex items-center gap-1">
                        🐝 Asentamiento de la Red Territorial
                      </p>
                      <p className="text-foreground font-medium">
                        {apiario.nombre || 'Asentamiento Tradicional'}
                      </p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        {apiario.zona ? `${apiario.zona} · ` : ''}{apiario.comuna}
                      </p>
                      <div className="mt-2 pt-1 border-t border-border text-[11px] text-muted-foreground">
                        Radio de pecoreo estimado: 2.0 km (Ley 21.489)
                      </div>
                      {capaActiva === 'restringida' && (
                        <div className="mt-1 text-[11px] text-primary/80">
                          Colmenas: {apiario.n_colmenas} · Categoría: {apiario.categoria}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Circle>

                {/* En modo restringido mostramos el marcador exacto */}
                {capaActiva === 'restringida' && (
                  <Marker
                    position={[apiario.lat_aproximada!, apiario.lng_aproximada!]}
                    icon={ICON_RESIDENTE}
                  />
                )}
              </div>
            ))}
        </MapContainer>

        {/* Leyenda Táctica Flotante */}
        <div className="absolute bottom-4 left-4 z-[500] bg-background/90 backdrop-blur-md border border-border p-3 rounded-xl shadow-lg text-xs max-w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Capa {capaActiva}
            </span>
            <button
              onClick={() => setMostrarLeyenda(!mostrarLeyenda)}
              className="text-[10px] text-muted-foreground hover:text-foreground font-mono"
            >
              {mostrarLeyenda ? 'Ocultar' : 'Ver'}
            </button>
          </div>

          {mostrarLeyenda && (
            <div className="flex flex-col gap-2 pt-1 border-t border-border/50 text-[11px]">
              {capaActiva === 'publica' && (
                <p className="text-muted-foreground leading-relaxed">
                  Zonas aproximadas de pecoreo para resguardar la privacidad exacta y evitar el pillaje.
                </p>
              )}
              {capaActiva !== 'publica' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-[8px]">
                      🐝
                    </span>
                    <span className="text-foreground">Halo pecoreo de la red (2,0 km)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-[8px]">
                      🚚
                    </span>
                    <span className="text-foreground">Trashumante en tránsito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-destructive/20 border border-destructive flex items-center justify-center text-[8px]">
                      ⚠️
                    </span>
                    <span className="text-foreground">Resguardo fitosanitario (3 km)</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
