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

const ICON_EXT = createMapBadgeIcon(MAP_BOSQUE, '🐝', 28);
const ICON_PREDIO = createMapBadgeIcon(MAP_MIEL, '🏞️', 28);
const ICON_ALERTA = createMapBadgeIcon(MAP_ALERTA, '⚠️', 28);
const ICON_FLOR = createMapBadgeIcon(MAP_FLOR, '🌸', 28);

function FitBounds({ data }: { data: MapaChiloePublico }) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [
      ...data.apiarios.map((a) => [a.lat, a.lng] as [number, number]),
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
      <ZoomControl position="bottomleft" zoomInTitle="Acercar" zoomOutTitle="Alejar" />
      <EsriSatelliteTileLayers />
      <FitBounds data={data} />

      {showApiarios &&
        data.apiarios.map((a) => (
          <Fragment key={a.id}>
            <Circle
              center={[a.lat, a.lng]}
              radius={1000}
              pathOptions={{
                color: a.tipo === 'externo' ? MAP_BOSQUE : MAP_MIEL,
                fillColor: a.tipo === 'externo' ? MAP_BOSQUE : MAP_MIEL,
                fillOpacity: 0.22,
                weight: 1.5,
              }}
            />
            <Marker
              position={[a.lat, a.lng]}
              icon={a.tipo === 'externo' ? ICON_EXT : ICON_PREDIO}
            >
              <Popup autoPan={true} autoPanPadding={[60, 60]} offset={[0, -10]}>
                <div className="text-sm space-y-1">
                  <p className="font-bold">
                    {a.tipo === 'externo' ? 'Apiario declarado' : 'Predio facilitador'}
                  </p>
                  <p>
                    <strong>Comuna:</strong> {a.comuna}
                  </p>
                  {a.zona && (
                    <p>
                      <strong>Zona:</strong> {a.zona}
                    </p>
                  )}
                  {a.tipo === 'externo' && (
                    <>
                      <p>
                        <strong>Colmenas:</strong> {a.colmenas_banda}
                      </p>
                      {a.comuna_origen && (
                        <p>
                          <strong>Origen:</strong> {a.comuna_origen}
                        </p>
                      )}
                    </>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Ubicación aproximada (±1 km)
                  </p>
                </div>
              </Popup>
            </Marker>
          </Fragment>
        ))}

      {showAlertas &&
        data.alertas.map((al) => (
          <Fragment key={al.id}>
            <Circle
              center={[al.lat, al.lng]}
              radius={al.radio_km * 1000}
              pathOptions={{
                color: MAP_ALERTA,
                fillColor: MAP_ALERTA,
                fillOpacity: 0.15,
                weight: 1,
              }}
            />
            <Marker position={[al.lat, al.lng]} icon={ICON_ALERTA}>
              <Popup autoPan={true} autoPanPadding={[60, 60]} offset={[0, -10]}>
                <div className="text-sm space-y-1">
                  <p className="font-bold text-destructive">Alerta fitosanitaria</p>
                  <p>
                    <strong>Tipo:</strong> {al.tipo_producto || 'aplicación'}
                  </p>
                  <p>
                    <strong>Comuna / zona:</strong> {al.comuna} · {al.zona}
                  </p>
                  {al.fecha_programada && (
                    <p>
                      <strong>Fecha:</strong>{' '}
                      {new Date(al.fecha_programada).toLocaleString('es-CL')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Radio ~{al.radio_km} km · sin nombre comercial
                  </p>
                </div>
              </Popup>
            </Marker>
          </Fragment>
        ))}

      {showFloraciones &&
        data.floraciones.map((f) => (
          <Marker key={f.id} position={[f.lat, f.lng]} icon={ICON_FLOR}>
            <Popup autoPan={true} autoPanPadding={[60, 60]} offset={[0, -10]}>
              <div className="text-sm space-y-1">
                <p className="font-bold">Floración / estación</p>
                {f.especie && <p>{f.especie}</p>}
                {f.fase && <p className="text-xs">{f.fase}</p>}
                {f.fecha && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(f.fecha).toLocaleDateString('es-CL')}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
