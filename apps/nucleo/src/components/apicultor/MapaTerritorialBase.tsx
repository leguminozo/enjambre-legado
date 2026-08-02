'use client';

import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, Badge, Switch, Label } from '@enjambre/ui';
import { MapPin, Shield, Users, Eye } from 'lucide-react';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom Icons
const createIcon = (color: string, emoji: string) => L.divIcon({
  className: 'custom-map-icon',
  html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 14px;">${emoji}</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

const ICON_RESIDENTE = createIcon('hsl(var(--primary))', '🐝');
const ICON_TRASHUMANTE = createIcon('hsl(var(--accent))', '🚚');
const ICON_ALERTA = createIcon('hsl(var(--destructive))', '⚠️');

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
  actores_registro: { nombre_actor: string, rup?: string };
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

export function MapaTerritorial({ actores, alertas, apiariosExternos = [], apiariosRegistro = [] }: MapaTerritorialProps) {
  // Centro aproximado de Chiloé
  const CHILOE_CENTER: [number, number] = [-42.48, -73.76];
  
  const [capaActiva, setCapaActiva] = useState<'publica' | 'comunitaria' | 'restringida'>('comunitaria');

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-sunken flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Visor Territorial
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Visualización por capas de confianza
          </p>
        </div>
        
        {/* Selector de Capas */}
        <div className="flex bg-background border border-border rounded-lg p-1">
          <button
            onClick={() => setCapaActiva('publica')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors flex items-center gap-2 ${capaActiva === 'publica' ? 'bg-surface-raised text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Eye className="w-3.5 h-3.5" />
            Pública
          </button>
          <button
            onClick={() => setCapaActiva('comunitaria')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors flex items-center gap-2 ${capaActiva === 'comunitaria' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="w-3.5 h-3.5" />
            Comunitaria
          </button>
          <button
            onClick={() => setCapaActiva('restringida')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors flex items-center gap-2 ${capaActiva === 'restringida' ? 'bg-destructive/10 text-destructive shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Shield className="w-3.5 h-3.5" />
            Restringida
          </button>
        </div>
      </div>

      <div className="h-[500px] w-full relative z-0">
        <MapContainer 
          center={CHILOE_CENTER} 
          zoom={9} 
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Capa Comunitaria y Restringida: Mostrar alertas */}
          {(capaActiva === 'comunitaria' || capaActiva === 'restringida') && (
            alertas.filter(a => a.lat_aproximada && a.lng_aproximada && a.estado === 'activa').map(alerta => (
              <div key={alerta.id}>
                {/* Círculo de impacto de la alerta */}
                <Circle 
                  center={[alerta.lat_aproximada!, alerta.lng_aproximada!]} 
                  radius={(alerta.radio_km || 3) * 1000}
                  pathOptions={{ 
                    color: 'hsl(var(--destructive))',
                    fillColor: 'hsl(var(--destructive))',
                    fillOpacity: 0.2,
                    weight: 1
                  }}
                />
                {/* Marcador central de la alerta */}
                <Marker 
                  position={[alerta.lat_aproximada!, alerta.lng_aproximada!]}
                  icon={ICON_ALERTA}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold text-destructive mb-1">⚠️ Alerta Fitosanitaria</p>
                      <p><strong>Producto:</strong> {alerta.producto}</p>
                      <p><strong>Zona:</strong> {alerta.zona}</p>
                      <p><strong>Fecha:</strong> {new Date(alerta.fecha_programada).toLocaleDateString('es-CL')}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Radio de afectación: {alerta.radio_km || 3}km
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </div>
            ))
          )}

          {/* Capa Comunitaria y Restringida: Mostrar apiarios */}
          {(capaActiva === 'comunitaria' || capaActiva === 'restringida') && (
            apiariosExternos.filter(a => a.lat_aproximada && a.lng_aproximada).map(apiario => (
              <div key={apiario.id}>
                {/* En capa comunitaria mostramos un círculo de incertidumbre para proteger la ubicación exacta */}
                {capaActiva === 'comunitaria' && (
                  <Circle 
                    center={[apiario.lat_aproximada!, apiario.lng_aproximada!]} 
                    radius={1000} // 1km de incertidumbre
                    pathOptions={{ 
                      color: 'hsl(var(--accent))',
                      fillOpacity: 0.1,
                      weight: 1,
                      dashArray: '4, 4'
                    }}
                  />
                )}
                <Marker 
                  position={[apiario.lat_aproximada!, apiario.lng_aproximada!]}
                  icon={ICON_TRASHUMANTE}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold mb-1">
                        🚚 Apiario Trashumante
                      </p>
                      <p><strong>Actor:</strong> {apiario.actores_registro?.nombre_actor}</p>
                      {capaActiva === 'restringida' && (
                        <p className="text-xs text-destructive mt-2 border-t pt-2">
                          Vista Administrador: Coordenadas Exactas
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </div>
            ))
          )}

          {/* Capa Comunitaria y Restringida: apiarios declarados en el censo */}
          {(capaActiva === 'comunitaria' || capaActiva === 'restringida') && (
            apiariosRegistro
              .filter(a => a.lat_aproximada != null && a.lng_aproximada != null)
              .map(apiario => (
                <div key={apiario.id}>
                  {capaActiva === 'comunitaria' && (
                    <Circle
                      center={[apiario.lat_aproximada!, apiario.lng_aproximada!]}
                      radius={1000}
                      pathOptions={{
                        color: 'hsl(var(--primary))',
                        fillOpacity: 0.1,
                        weight: 1,
                        dashArray: '4, 4',
                      }}
                    />
                  )}
                  <Marker
                    position={[apiario.lat_aproximada!, apiario.lng_aproximada!]}
                    icon={ICON_RESIDENTE}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold mb-1">🐝 Apiario del Registro</p>
                        <p><strong>Colmenas:</strong> {apiario.n_colmenas}</p>
                        <p><strong>Sector:</strong> {apiario.zona} · {apiario.comuna}</p>
                        {capaActiva === 'restringida' && (
                          <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                            {apiario.nombre || 'Sin nombre'} · {apiario.categoria}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </div>
              ))
          )}

        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur border border-border p-3 rounded-lg shadow-sm text-xs">
          <p className="font-medium text-foreground mb-2">Leyenda de capa: {capaActiva}</p>
          <div className="flex flex-col gap-2">
            {capaActiva === 'publica' && (
              <p className="text-muted-foreground max-w-[200px]">
                En nivel público sólo se visualizarán polígonos generales de actividad (en desarrollo).
              </p>
            )}
            {(capaActiva === 'comunitaria' || capaActiva === 'restringida') && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary flex items-center justify-center text-[8px]">🐝</span>
                  <span>Apiario Local</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-accent flex items-center justify-center text-[8px]">🚚</span>
                  <span>Trashumante</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-destructive flex items-center justify-center text-[8px]">⚠️</span>
                  <span>Alerta (radio {capaActiva === 'comunitaria' ? 'aprox' : 'exacto'})</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
