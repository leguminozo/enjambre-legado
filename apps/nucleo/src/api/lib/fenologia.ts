/**
 * api/lib/fenologia.ts
 * Cálculo de GDD server-side (Open-Meteo ERA5 histórico + pronóstico 16d).
 * Fórmula estándar: Σ max(0, (Tmax+Tmin)/2 − Tbase), acumulado desde 1-jul (hemisferio sur).
 */

const OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/era5";

export function gddDiario(tmax: number | null, tmin: number | null, tbase: number): number {
  if (tmax == null || tmin == null) return 0;
  const media = (tmax + tmin) / 2;
  return Math.max(0, media - tbase);
}

/**
 * Agrupa especies por su Tbase para acumular GDD con una sola llamada a
 * Open-Meteo por Tbase distinta (misma estación para todas).
 */
export function agruparEspeciesPorTbase<T extends { tbase_c?: number | string | null }>(
  especies: T[],
): Map<number, T[]> {
  const grupos = new Map<number, T[]>();
  for (const esp of especies) {
    const tbase = Number(esp.tbase_c ?? 5);
    const lista = grupos.get(tbase) ?? [];
    lista.push(esp);
    grupos.set(tbase, lista);
  }
  return grupos;
}

function inicioTemporadaGDD(ano: number): string {
  // Temporada fenológica hemisferio sur: acumulación desde el 1 de julio
  return `${ano}-07-01`;
}

interface SerieGDD {
  fecha: string;
  gdd: number;
  acumulado: number;
}

async function fetchDaily(
  url: string,
  lat: number,
  lng: number,
  start: string,
  end: string,
): Promise<{ time: string[]; tmax: number[]; tmin: number[] } | null> {
  try {
    const u = `${url}?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min&start_date=${start}&end_date=${end}&timezone=America%2FSantiago`;
    const res = await fetch(u);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      time: data.daily?.time ?? [],
      tmax: data.daily?.temperature_2m_max ?? [],
      tmin: data.daily?.temperature_2m_min ?? [],
    };
  } catch {
    return null;
  }
}

/** GDD acumulado desde el 1-jul hasta una fecha (histórico ERA5, gratis sin key). */
export async function gddHistoricoAcumulado(
  lat: number,
  lng: number,
  hasta: Date,
  tbase: number,
): Promise<{ acumulado: number; serie: SerieGDD[] } | null> {
  const hoy = hasta;
  const inicio = inicioTemporadaGDD(hoy.getUTCFullYear());
  const end = hoy.toISOString().slice(0, 10);
  const daily = await fetchDaily(OPEN_METEO_ARCHIVE, lat, lng, inicio, end);
  if (!daily) return null;
  let acum = 0;
  const serie: SerieGDD[] = [];
  for (let i = 0; i < daily.time.length; i++) {
    acum += gddDiario(daily.tmax[i], daily.tmin[i], tbase);
    serie.push({ fecha: daily.time[i], gdd: gddDiario(daily.tmax[i], daily.tmin[i], tbase), acumulado: acum });
  }
  return { acumulado: acum, serie };
}

/** Pronóstico GDD diario a N días (Open-Meteo, 16 días máx). */
export async function gddPronostico(
  lat: number,
  lng: number,
  dias: number,
  tbase: number,
): Promise<{ serie: SerieGDD[]; acumulado: number } | null> {
  const hoy = new Date();
  const start = hoy.toISOString().slice(0, 10);
  const end = new Date(hoy.getTime() + (dias - 1) * 86400000).toISOString().slice(0, 10);
  const daily = await fetchDaily(OPEN_METEO_FORECAST, lat, lng, start, end);
  if (!daily) return null;
  let acum = 0;
  const serie: SerieGDD[] = [];
  for (let i = 0; i < daily.time.length; i++) {
    acum += gddDiario(daily.tmax[i], daily.tmin[i], tbase);
    serie.push({ fecha: daily.time[i], gdd: gddDiario(daily.tmax[i], daily.tmin[i], tbase), acumulado: acum });
  }
  return { serie, acumulado: acum };
}

export interface PronosticoEspecie {
  id: string;
  nombreCientifico: string;
  nombreComun: string;
  tbase: number;
  gddUmbral: number | null;
  gddActual: number;
  gddProyectado16d: number | null;
  progreso: number | null;
  diasEstimados: number | null;
  enFloracion: boolean;
  enVentana: boolean;
  origen?: string;
  habito?: string;
  relevanciaApicola?: string;
  fotoUrl?: string | null;
}

/**
 * Pronóstico de floración por especie: GDD histórico acumulado + proyección a 16 días.
 * diasEstimados = días hasta cruzar el umbral dentro del horizonte del pronóstico;
 * null si el umbral no se alcanza en 16 días (o no está calibrado).
 */
export function proyectarFloracion(
  especie: {
    id: string;
    nombre_cientifico: string;
    nombre_comun: string;
    tbase_c: number;
    gdd_umbral: number | null;
    ventana_ini: number | null;
    ventana_fin: number | null;
    origen?: string;
    habito?: string;
    relevancia_apicola?: string;
    foto_url?: string | null;
  },
  historico: { acumulado: number } | null,
  pronostico: { serie: SerieGDD[]; acumulado: number } | null,
  fecha?: Date,
): PronosticoEspecie {
  const tbase = Number(especie.tbase_c ?? 5);
  const umbral = especie.gdd_umbral != null ? Number(especie.gdd_umbral) : null;
  const gddActual = historico?.acumulado ?? 0;
  const gddProyectado = pronostico ? gddActual + pronostico.acumulado : null;

  let diasEstimados: number | null = null;
  let enFloracion = false;
  if (umbral != null) {
    if (gddActual >= umbral) {
      enFloracion = true;
      diasEstimados = 0;
    } else if (pronostico) {
      for (let i = 0; i < pronostico.serie.length; i++) {
        if (gddActual + pronostico.serie[i].acumulado >= umbral) {
          diasEstimados = i + 1;
          break;
        }
      }
    }
  }

  const mes = (fecha ?? new Date()).getMonth() + 1;
  const enVentana =
    especie.ventana_ini != null && especie.ventana_fin != null
      ? (especie.ventana_ini <= especie.ventana_fin
          ? mes >= especie.ventana_ini && mes <= especie.ventana_fin
          : mes >= especie.ventana_ini || mes <= especie.ventana_fin)
      : true;

  return {
    id: especie.id,
    nombreCientifico: especie.nombre_cientifico,
    nombreComun: especie.nombre_comun,
    tbase,
    gddUmbral: umbral,
    gddActual: Math.round(gddActual),
    gddProyectado16d: gddProyectado != null ? Math.round(gddProyectado) : null,
    progreso: umbral != null ? Math.min(Math.round((gddActual / umbral) * 100), 100) : null,
    diasEstimados,
    enFloracion,
    enVentana,
    origen: especie.origen,
    habito: especie.habito,
    relevanciaApicola: especie.relevancia_apicola,
    fotoUrl: especie.foto_url,
  };
}
