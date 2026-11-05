'use client';

import { MapContainer, Circle, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Fragment, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import type { MapaChiloePublico } from '@/lib/mapa-chiloe-publico';
import {
  EsriSatelliteTileLayers,
  createMapBadgeIcon,
  fixLeafletDefaultIcons,
} from '@/components/map/MapLayers';

fixLeafletDefaultIcons();

const MAP_BOSQUE = 'hsl(145 63% 42%)';
const MAP_MIEL = 'hsl(44 85% 46%)';
const MAP_ALERTA = 'hsl(0 72% 51%)';
const MAP_FLOR = 'hsl(145 30% 48%)';

function createTerritorialSealIcon(size = 32): L.DivIcon {
  const half = Math.round(size / 2);
  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:#064e3b;border:1.5px solid #ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fef3c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'enj-cuenca-seal-icon',
    html,
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half],
  });
}

const ICON_ZONA_COMUNAL = createTerritorialSealIcon(32);
const ICON_ALERTA = createMapBadgeIcon(MAP_ALERTA, '⚠️', 28);
const ICON_FLOR = createMapBadgeIcon(MAP_FLOR, '🌸', 28);

function FitBounds({ data }: { data: MapaChiloePublico }) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [
      ...(data.zonas_comunales ?? []).map((z) => [z.lat, z.lng] as [number, number]),
      ...data.alertas.map((a) => [a.lat, a.lng] as [number, number]),
      ...data.floraciones.map((f) => [f.lat, f.lng] as [number, number]),
    ];
    if (pts.length >= 2) {
      map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 11 });
    }
  }, [data, map]);
  return null;
}

/**
 * Cierra automáticamente cualquier popup abierto al hacer clic en un área
 * vacía del mapa o fuera de los marcadores / modales.
 */
function MapPopupAutoCloser() {
  const map = useMap();

  useEffect(() => {
    const onMapClick = () => {
      map.closePopup();
    };
    map.on('click', onMapClick);

    const onDocClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('.leaflet-popup') && !target.closest('.leaflet-marker-icon')) {
        map.closePopup();
      }
    };

    document.addEventListener('pointerdown', onDocClick);

    return () => {
      map.off('click', onMapClick);
      document.removeEventListener('pointerdown', onDocClick);
    };
  }, [map]);

  return null;
}

export function MapaChiloePublicoBase({
  data,
  showApiarios,
  showAlertas,
  showFloraciones,
}: {
  data: MapaChiloePublico;
  showApiarios: boolean;
  showAlertas: boolean;
  showFloraciones: boolean;
}) {
  return (
    <MapContainer
      center={[data.centro.lat, data.centro.lng]}
      zoom={data.centro.zoom}
      scrollWheelZoom={true}
      wheelPxPerZoomLevel={100}
      zoomSnap={0.5}
      zoomDelta={0.5}
      touchZoom={true}
      doubleClickZoom={true}
      dragging={true}
      bounceAtZoomLimits={true}
      inertia={true}
      inertiaDeceleration={3000}
      zoomControl={false}
      attributionControl={false}
      closePopupOnClick={true}
      className="h-full w-full z-0 cursor-grab active:cursor-grabbing"
      style={{ minHeight: 420 }}
    >
      <ZoomControl position="bottomleft" />
      <EsriSatelliteTileLayers />
      <FitBounds data={data} />
      <MapPopupAutoCloser />

      {/* Zonas Comunales de Pecoreo Protegido (Atlas Territorial Soberano) */}
      {showApiarios &&
        (data.zonas_comunales ?? []).map((z) => (
          <Fragment key={z.id}>
            <Circle
              center={[z.lat, z.lng]}
              radius={z.radio_metros}
              interactive={false}
              pathOptions={{
                color: MAP_BOSQUE,
                fillColor: MAP_BOSQUE,
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '5, 5',
              }}
            />
            <Marker position={[z.lat, z.lng]} icon={ICON_ZONA_COMUNAL}>
              <Popup autoPan={true} autoPanPadding={[60, 60]} offset={[0, -10]}>
                <div className="text-xs space-y-2 p-1 min-w-[220px] max-w-[260px]">
                  {/* Cabecera elegante */}
                  <div className="border-b border-border/60 pb-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-primary font-bold block mb-0.5">
                      Cuenca Melífera Territorial
                    </span>
                    <h3 className="font-bold text-foreground text-sm font-existencial leading-tight">
                      {z.comuna}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Zona comunal de pecoreo protegido
                    </p>
                  </div>

                  {/* Métricas territoriales */}
                  <div className="bg-surface-sunken/80 rounded-xl p-2.5 border border-border/50 space-y-1.5 text-foreground">
                    <p className="flex justify-between items-center text-[11px]">
                      <span className="text-muted-foreground">Asentamientos en red:</span>
                      <strong className="font-mono tabular-nums text-foreground font-semibold">{z.asentamientos_protegidos}</strong>
                    </p>
                    <p className="flex justify-between items-center text-[11px]">
                      <span className="text-muted-foreground">Apicultores locales:</span>
                      <strong className="font-mono tabular-nums text-foreground font-semibold">{z.actores_activos}</strong>
                    </p>
                    {z.alertas_activas > 0 ? (
                      <p className="text-destructive font-medium flex justify-between text-[11px] pt-1 border-t border-border/40">
                        <span>Alertas sanitarias:</span>
                        <strong className="font-mono tabular-nums">{z.alertas_activas} activa(s)</strong>
                      </p>
                    ) : (
                      <div className="pt-1 border-t border-border/40 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span>Sin avisos de pesticidas vigentes</span>
                      </div>
                    )}
                  </div>

                  {/* Botánica */}
                  <div className="text-[11px] text-muted-foreground leading-snug px-0.5">
                    <span className="text-foreground font-medium">Floración nativa:</span>{' '}
                    <span>{z.floracion_dominante}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          </Fragment>
        ))}

      {/* Alertas Fitosanitarias Preventivas */}
      {showAlertas &&
        data.alertas.map((al) => (
          <Fragment key={al.id}>
            <Circle
              center={[al.lat, al.lng]}
              radius={al.radio_km * 1000}
              interactive={false}
              pathOptions={{
                color: MAP_ALERTA,
                fillColor: MAP_ALERTA,
                fillOpacity: 0.16,
                weight: 1.2,
                dashArray: '6, 6',
              }}
            />
            <Marker position={[al.lat, al.lng]} icon={ICON_ALERTA}>
              <Popup autoPan={true} autoPanPadding={[60, 60]} offset={[0, -10]}>
                <div className="text-sm space-y-1">
                  <p className="font-bold text-destructive flex items-center gap-1">
                    ⚠️ Alerta preventiva de aplicación
                  </p>
                  <p>
                    <strong>Tipo:</strong> {al.tipo_producto || 'aplicación agrícola'}
                  </p>
                  <p>
                    <strong>Sector:</strong> {al.comuna} · {al.zona}
                  </p>
                  {al.fecha_programada && (
                    <p>
                      <strong>Fecha:</strong>{' '}
                      {new Date(al.fecha_programada).toLocaleString('es-CL')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Radio de resguardo ~{al.radio_km} km (sin marca comercial)
                  </p>
                </div>
              </Popup>
            </Marker>
          </Fragment>
        ))}

      {/* Estaciones Fenológicas de Floración Nativa */}
      {showFloraciones &&
        data.floraciones.map((f) => (
          <Marker key={f.id} position={[f.lat, f.lng]} icon={ICON_FLOR}>
            <Popup autoPan={true} autoPanPadding={[60, 60]} offset={[0, -10]}>
              <div className="text-sm space-y-1">
                <p className="font-bold flex items-center gap-1">🌸 Estación Fenológica</p>
                {f.especie && <p className="font-medium text-foreground">{f.especie}</p>}
                {f.fase && <p className="text-xs text-muted-foreground">{f.fase}</p>}
                {f.fecha && (
                  <p className="text-xs text-muted-foreground">
                    Observación: {new Date(f.fecha).toLocaleDateString('es-CL')}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
