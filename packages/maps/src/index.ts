/**
 * Utilidades y tipos para capas del Mapa del Legado.
 * Leaflet / react-leaflet se consumen en apps/nucleo para no duplicar bundles.
 */
export type MapLayerId = 'apiarios' | 'arboles' | 'ferias' | 'ventas';

export function latLngKey(lat: number, lng: number, precision = 5): string {
  return `${lat.toFixed(precision)},${lng.toFixed(precision)}`;
}
