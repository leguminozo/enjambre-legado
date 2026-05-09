/**
 * lib/meteo.ts
 * Integración con Open-Meteo y cálculos de fenología (Grados-Día de Crecimiento - GDD).
 * API Gratuita sin key.
 */

// Chiloé, Pureo (Aprox)
const LAT = -41.86;
const LNG = -73.82;

export interface MeteoData {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation: number[];
}

/**
 * Obtiene pronóstico hiper-local horario para Chiloé
 */
export async function fetchPronostico(): Promise<MeteoData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=America%2FSantiago`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error Open-Meteo API');
    const data = await res.json();
    return data.hourly;
  } catch (error) {
    console.error('Error obteniendo meteo:', error);
    return null;
  }
}

/**
 * Calcula los Grados-Día de Crecimiento (GDD) acumulados.
 * Umbral T_base para Ulmo/Tepú approx 5°C.
 */
export function calcularGDD(temperaturas_medias_diarias: number[], tBase = 5): number {
  return temperaturas_medias_diarias.reduce((acc, tMedia) => {
    return acc + Math.max(0, tMedia - tBase);
  }, 0);
}

/**
 * Determina si una hora específica es "volable" para las abejas
 */
export function esVolable(temp: number, hr: number, precipitacion: number, viento = 0): boolean {
  return temp >= 11 && hr < 85 && precipitacion < 0.2 && viento < 25;
}
