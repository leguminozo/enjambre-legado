'use client';

import { Fragment } from 'react';
import { TileLayer } from 'react-leaflet';
import L from 'leaflet';

/**
 * URLs canónicas para capas de mapas.
 * Patrón satelital de alta resolución usado en el Hero y visores de Chiloé.
 */
export const ESRI_WORLD_IMAGERY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export const ESRI_BOUNDARIES_PLACES_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

export const CARTO_DARK_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

/** Corrige el problema de rutas relativas de iconos por defecto de Leaflet en Next.js */
export function fixLeafletDefaultIcons() {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

/**
 * Capas satelitales estándar de alta resolución de Esri con límites y topónimos.
 * Este es el estándar visual unificado (patrón del Hero).
 */
export function EsriSatelliteTileLayers({ maxZoom = 18 }: { maxZoom?: number }) {
  return (
    <Fragment>
      <TileLayer
        url={ESRI_WORLD_IMAGERY_URL}
        maxZoom={maxZoom}
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
      />
      <TileLayer
        url={ESRI_BOUNDARIES_PLACES_URL}
        maxZoom={maxZoom}
        opacity={0.85}
      />
    </Fragment>
  );
}

/**
 * Capa oscura alternativa para visualizaciones nocturnas o de datos densos.
 */
export function DarkCartoTileLayer({ maxZoom = 19 }: { maxZoom?: number }) {
  return (
    <TileLayer
      url={CARTO_DARK_URL}
      subdomains="abcd"
      maxZoom={maxZoom}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
    />
  );
}

/**
 * Crea un DivIcon de Leaflet circular con emoji centralizado y borde blanco nítido.
 */
export function createMapBadgeIcon(
  color: string,
  emoji: string,
  size = 28,
): L.DivIcon {
  const half = Math.round(size / 2);
  return L.divIcon({
    className: 'enj-map-badge-icon',
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.45);font-size:${Math.round(size * 0.46)}px;user-select:none;">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half],
  });
}
