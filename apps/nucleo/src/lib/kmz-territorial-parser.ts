/**
 * Parser y normalizador territorial para archivos KMZ/KML del archipiélago de Chiloé.
 * Extrae apiarios, titulares, fechas de inicio (antigüedad/trayectoria) y asigna comuna por coordenadas.
 * Sin dependencias externas pesadas.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

export interface ApiarioKmzExtraido {
  id: string;
  titular: string;
  nombre_apiario: string;
  comuna: string;
  lat: number;
  lng: number;
  fecha_inicio: string | null;
  ultima_actualizacion: string | null;
  antiguedad_anos: number | null;
}

export interface KmzResumenTerritorial {
  total_apiarios: number;
  total_titulares: number;
  por_comuna: Record<string, { apiarios: number; titulares: number }>;
  apiarios: ApiarioKmzExtraido[];
}

/**
 * Centros y límites aproximados de comunas de Chiloé para deducción geográfica.
 */
export const COMUNAS_CHILOE_BOUNDS: Array<{
  comuna: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
  center: [number, number];
}> = [
  { comuna: 'Ancud', latMin: -42.05, latMax: -41.70, lngMin: -74.15, lngMax: -73.45, center: [-41.87, -73.83] },
  { comuna: 'Quemchi', latMin: -42.30, latMax: -42.05, lngMin: -73.70, lngMax: -73.30, center: [-42.14, -73.48] },
  { comuna: 'Dalcahue', latMin: -42.45, latMax: -42.25, lngMin: -73.85, lngMax: -73.45, center: [-42.38, -73.65] },
  { comuna: 'Curaco de Vélez', latMin: -42.50, latMax: -42.40, lngMin: -73.65, lngMax: -73.55, center: [-42.44, -73.60] },
  { comuna: 'Quinchao', latMin: -42.60, latMax: -42.40, lngMin: -73.55, lngMax: -73.30, center: [-42.47, -73.50] },
  { comuna: 'Castro', latMin: -42.55, latMax: -42.40, lngMin: -73.90, lngMax: -73.68, center: [-42.48, -73.77] },
  { comuna: 'Puqueldón', latMin: -42.68, latMax: -42.54, lngMin: -73.75, lngMax: -73.55, center: [-42.59, -73.65] },
  { comuna: 'Chonchi', latMin: -42.75, latMax: -42.55, lngMin: -74.20, lngMax: -73.65, center: [-42.62, -73.77] },
  { comuna: 'Queilén', latMin: -43.00, latMax: -42.75, lngMin: -73.70, lngMax: -73.40, center: [-42.89, -73.47] },
  { comuna: 'Quellón', latMin: -43.50, latMax: -42.95, lngMin: -74.30, lngMax: -73.40, center: [-43.12, -73.61] },
];

export function deducirComunaChiloe(lat: number, lng: number): string {
  for (const b of COMUNAS_CHILOE_BOUNDS) {
    if (lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax) {
      return b.comuna;
    }
  }

  // Si cae fuera de los rectángulos exactos, buscar por distancia euclidiana al centroide
  let mejorDist = Infinity;
  let mejorComuna = 'Castro';

  for (const b of COMUNAS_CHILOE_BOUNDS) {
    const d = Math.hypot(lat - b.center[0], lng - b.center[1]);
    if (d < mejorDist) {
      mejorDist = d;
      mejorComuna = b.comuna;
    }
  }

  return mejorComuna;
}

/**
 * Parsea el contenido XML de un KML para extraer apiarios.
 */
export function parseKmlApiarios(kmlText: string): ApiarioKmzExtraido[] {
  const apiarios: ApiarioKmzExtraido[] = [];
  const placemarkMatches = kmlText.match(/<Placemark>[\s\S]*?<\/Placemark>/gi) || [];

  const anioActual = new Date().getFullYear();

  for (let i = 0; i < placemarkMatches.length; i++) {
    const pm = placemarkMatches[i];

    // Titular / Nombre
    const nameMatch = pm.match(/<name>([\s\S]*?)<\/name>/i);
    const titular = nameMatch ? nameMatch[1].trim() : 'Titular no especificado';

    // Description
    const descMatch = pm.match(/<description>([\s\S]*?)<\/description>/i);
    const desc = descMatch ? descMatch[1].trim() : '';

    let nombreApiario = `Apiario ${i + 1}`;
    let fechaInicio: string | null = null;
    let ultimaActualizacion: string | null = null;

    for (const line of desc.split('\n')) {
      const trimmed = line.trim();
      if (/^nombre\s*:/i.test(trimmed)) {
        nombreApiario = trimmed.replace(/^nombre\s*:/i, '').trim();
      } else if (/^fecha\s*inicio\s*:/i.test(trimmed)) {
        fechaInicio = trimmed.replace(/^fecha\s*inicio\s*:/i, '').trim();
      } else if (/^ultima\s*actua/i.test(trimmed)) {
        ultimaActualizacion = trimmed.replace(/^ultima\s*actua[^:]*:/i, '').trim();
      }
    }

    // Coordenadas
    const coordMatch = pm.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
    if (!coordMatch) continue;

    const [lngStr, latStr] = coordMatch[1].trim().split(',');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    // Calcular antigüedad si fecha_inicio tiene formato DD/MM/YYYY
    let antiguedadAnos: number | null = null;
    if (fechaInicio) {
      const parts = fechaInicio.split('/');
      if (parts.length === 3) {
        const year = parseInt(parts[2], 10);
        if (Number.isFinite(year) && year > 1980 && year <= anioActual) {
          antiguedadAnos = anioActual - year;
        }
      }
    }

    const comuna = deducirComunaChiloe(lat, lng);

    apiarios.push({
      id: `kmz-${i + 1}`,
      titular,
      nombre_apiario: nombreApiario,
      comuna,
      lat,
      lng,
      fecha_inicio: fechaInicio,
      ultima_actualizacion: ultimaActualizacion,
      antiguedad_anos: antiguedadAnos,
    });
  }

  return apiarios;
}

/**
 * Carga y analiza un archivo KMZ o KML desde el disco.
 */
export function parseKmzFile(filePath: string): KmzResumenTerritorial {
  if (!existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }

  let kmlText = '';
  if (filePath.endsWith('.kml')) {
    kmlText = readFileSync(filePath, 'utf8');
  } else {
    // Para KMZ: extraer doc.kml usando unzip estándar de Unix/Mac
    try {
      kmlText = execSync(`unzip -p "${filePath}" doc.kml`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
    } catch {
      // Fallback a cualquier .kml dentro del zip
      kmlText = execSync(`unzip -p "${filePath}" "*.kml"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
    }
  }

  const apiarios = parseKmlApiarios(kmlText);

  const titularesSet = new Set<string>();
  const porComuna: Record<string, { apiarios: number; titulares: number }> = {};

  for (const a of apiarios) {
    titularesSet.add(a.titular);
    if (!porComuna[a.comuna]) {
      porComuna[a.comuna] = { apiarios: 0, titulares: 0 };
    }
    porComuna[a.comuna].apiarios += 1;
  }

  // Contar titulares únicos por comuna
  for (const [comuna] of Object.entries(porComuna)) {
    const tComuna = new Set(apiarios.filter((a) => a.comuna === comuna).map((a) => a.titular));
    porComuna[comuna].titulares = tComuna.size;
  }

  return {
    total_apiarios: apiarios.length,
    total_titulares: titularesSet.size,
    por_comuna: porComuna,
    apiarios,
  };
}
