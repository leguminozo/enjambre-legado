import { GUARDIAN_COOLDOWN_DAYS, PERFIL_CATA_MIN_SESIONES } from './constants';

export type VentaLine = {
  productId?: string;
  producto_id?: string;
  quantity?: number;
};

export function ventaContainsProduct(
  productos: unknown,
  productoId: string,
): boolean {
  if (!Array.isArray(productos)) return false;
  return productos.some((line) => {
    if (typeof line !== 'object' || line === null) return false;
    const record = line as VentaLine;
    const id = record.productId ?? record.producto_id;
    return id === productoId;
  });
}

export function isWithinCooldown(
  lastReviewAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (!lastReviewAt) return false;
  const last = new Date(lastReviewAt);
  if (Number.isNaN(last.getTime())) return false;
  const diffMs = now.getTime() - last.getTime();
  const cooldownMs = GUARDIAN_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  return diffMs < cooldownMs;
}

export function computeAggregateRating(
  ratings: number[],
): { ratingValue: number; reviewCount: number } | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  const avg = sum / ratings.length;
  return {
    ratingValue: Math.round(avg * 10) / 10,
    reviewCount: ratings.length,
  };
}

/** Chip con su frecuencia relativa dentro del bloque. */
export interface ChipFrecuencia {
  chip: string;
  bloque: string;
  frecuencia: number; // 0–1
  count: number;
}

/** Par semántico con su mediana. */
export interface ParAgregado {
  par: string;
  mediana: number; // -3 a +3
  n: number;
}

/** Perfil sensorial colectivo de una floración. */
export interface PerfilFloracionAgregado {
  floracion_slug: string;
  temporada: string | null;
  n_sesiones: number;
  publicable: boolean; // true si n_sesiones >= PERFIL_CATA_MIN_SESIONES
  chips: ChipFrecuencia[];
  pares: ParAgregado[];
  rating_promedio: number | null;
  review_count: number;
}

type PercChipRow = { bloque: string; chip: string };
type PercParRow = { par: string; valor: number };
type ResenaRatingRow = { rating: number };

interface FloracionSesion {
  perc_chips: PercChipRow[];
  perc_pares: PercParRow[];
}

/**
 * Agrega el perfil sensorial colectivo de sesiones CATA de una floración.
 * Respeta el umbral mínimo de sesiones para publicar (PERFIL_CATA_MIN_SESIONES).
 * Safe: no hace consultas, recibe los datos ya resueltos del BFF.
 */
export function computeFloracionAggregate(params: {
  floracion_slug: string;
  temporada: string | null;
  sesiones: FloracionSesion[];
  ratings: ResenaRatingRow[];
}): PerfilFloracionAgregado {
  const { floracion_slug, temporada, sesiones, ratings } = params;
  const n = sesiones.length;
  const publicable = n >= PERFIL_CATA_MIN_SESIONES;

  // ── Chips: frecuencia relativa por bloque ──────────────────────────────────
  const chipCount: Record<string, { bloque: string; count: number }> = {};
  for (const sesion of sesiones) {
    for (const c of sesion.perc_chips) {
      const key = `${c.bloque}::${c.chip}`;
      if (!chipCount[key]) {
        chipCount[key] = { bloque: c.bloque, count: 0 };
      }
      chipCount[key].count += 1;
    }
  }

  const chips: ChipFrecuencia[] = Object.entries(chipCount)
    .map(([key, val]) => ({
      chip: key.split('::')[1] ?? key,
      bloque: val.bloque,
      count: val.count,
      frecuencia: n > 0 ? val.count / n : 0,
    }))
    .sort((a, b) => b.frecuencia - a.frecuencia);

  // ── Pares semánticos: mediana ──────────────────────────────────────────────
  const paresBucket: Record<string, number[]> = {};
  for (const sesion of sesiones) {
    for (const p of sesion.perc_pares) {
      if (!paresBucket[p.par]) paresBucket[p.par] = [];
      paresBucket[p.par].push(p.valor);
    }
  }

  const pares: ParAgregado[] = Object.entries(paresBucket).map(([par, valores]) => {
    const sorted = [...valores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const mediana =
      sorted.length % 2 === 0
        ? (sorted[mid - 1]! + sorted[mid]!) / 2
        : (sorted[mid] ?? 0);
    return { par, mediana: Math.round(mediana * 10) / 10, n: sorted.length };
  });

  // ── Rating promedio de reseñas de floración ────────────────────────────────
  const ratingNums = ratings.map((r) => r.rating);
  const aggregate = computeAggregateRating(ratingNums);

  return {
    floracion_slug,
    temporada,
    n_sesiones: n,
    publicable,
    chips,
    pares,
    rating_promedio: aggregate?.ratingValue ?? null,
    review_count: aggregate?.reviewCount ?? 0,
  };
}