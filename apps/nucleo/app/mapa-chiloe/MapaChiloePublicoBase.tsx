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

const ICON_ZONA_COMUNAL = createMapBadgeIcon(MAP_BOSQUE, '🛡️', 32);
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
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full z-0"
      style={{ minHeight: 420 }}
    >
      <ZoomControl position="bottomleft" />
      <EsriSatelliteTileLayers />
      <FitBounds data={data} />

      {/* Zonas Comunales de Pecoreo Protegido (Atlas Territorial Soberano) */}
      {showApiarios &&
        (data.zonas_comunales ?? []).map((z) => (
          <Fragment key={z.id}>
            <Circle
              center={[z.lat, z.lng]}
              radius={z.radio_metros}
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
                <div className="text-sm space-y-1.5 p-0.5 max-w-[240px]">
                  <div className="flex items-center gap-1.5 border-b border-border/60 pb-1.5">
                    <span className="text-base">🛡️</span>
                    <div>
                      <p className="font-bold text-foreground leading-tight text-xs sm:text-sm">
                        Cuenca Apícola · {z.comuna}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Resguardo Territorial (Ley 21.489)
                      </p>
                    </div>
                  </div>
                  <div className="text-xs space-y-1 text-foreground">
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Asentamientos en red:</span>
                      <strong className="font-mono tabular-nums">{z.asentamientos_protegidos}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Apicultores locales:</span>
                      <strong className="font-mono tabular-nums">{z.actores_activos}</strong>
                    </p>
                    {z.alertas_activas > 0 ? (
                      <p className="text-destructive font-medium flex justify-between pt-0.5">
                        <span>Alertas sanitarias:</span>
                        <strong className="font-mono tabular-nums">{z.alertas_activas} activa(s)</strong>
                      </p>
                    ) : (
                      <p className="text-emerald-700 dark:text-emerald-400 font-medium text-[11px] pt-0.5">
                        ✓ Sin avisos de pesticidas vigentes
                      </p>
                    )}
                    <div className="pt-1.5 mt-1 border-t border-border/40 text-[11px] text-muted-foreground leading-snug">
                      <strong className="text-foreground">Floración nativa:</strong> {z.floracion_dominante}
                    </div>
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
