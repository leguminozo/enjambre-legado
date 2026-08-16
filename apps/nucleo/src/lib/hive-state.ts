/**
 * HiveState — estado unificado de colmena para gemelo, listas y (futuro) DaaS.
 *
 * Principio: solo señales verificables. Sin inventar sensores.
 * Meteo = ambiente de zona, no temperatura de cría.
 * Riesgo = reglas documentadas sobre peso, varroa, health, inspecciones y alertas.
 */

import type { ColmenaWithRelations, InspeccionRow, PesoRow, VarroaRow } from './apicultor-types';

// ─── Public types ───────────────────────────────────────────────────────────

export type RiskLevel = 'ok' | 'watch' | 'alert' | 'critical' | 'unknown';

export type WeightTrend = 'up' | 'down' | 'flat' | 'unknown';

export type SignalSource = 'record' | 'inspection' | 'column' | 'meteo' | 'derived' | 'missing';

/** Umbrales varroa: `varroa_records.level` se usa en la UI como escala ~0–10 (mock/bitácora). */
export const VARROA_THRESHOLDS = {
  watch: 2,
  alert: 3,
  critical: 4,
} as const;

export const INSPECTION_STALE_DAYS = { watch: 30, alert: 60 } as const;
export const VARROA_STALE_DAYS = 30;
/** Caída de peso entre las dos últimas mediciones (fracción). */
export const WEIGHT_DROP_ALERT = 0.15;

export interface TerritorialAlertInput {
  lat_aproximada: number | null;
  lng_aproximada: number | null;
  radio_km: number;
  estado: string;
  fecha_programada?: string;
}

export interface HiveStateContext {
  /** Temperatura ambiental de zona (Open-Meteo / estación), no sensor de cría. */
  ambientTempC?: number | null;
  /** Coordenadas del apiario para radio de alertas. */
  apiarioLat?: number | null;
  apiarioLng?: number | null;
  /** Alertas fitosanitarias activas (opcional). */
  territorialAlerts?: TerritorialAlertInput[];
  /** Ahora (inyectable en tests). */
  now?: Date;
}

export interface HiveState {
  id: string;
  name: string;
  apiarioId: string | null;
  apiarioName?: string;

  risk: RiskLevel;
  riskScore: number;
  riskLabel: string;
  /** Color CSS/hex legible para 3D y badges. */
  color: string;

  weightKg: number | null;
  weightDate: string | null;
  weightTrend: WeightTrend;

  varroaLevel: number | null;
  varroaDate: string | null;
  varroaSource: SignalSource;

  health: 'optimal' | 'attention' | 'risk' | null;

  lastInspectionDate: string | null;
  daysSinceInspection: number | null;
  queenPresent: boolean | null;
  enjambrazonRiesgo: string | null;

  /** Ambiente de zona — no confundir con temp de colmena. */
  ambientTempC: number | null;
  floracion: string | null;
  loteActivo: string | null;
  productionTotalKg: number | null;

  alertsNearby: number;
  primaryAction: string | null;

  signalQuality: 'rich' | 'partial' | 'sparse';
  missingSignals: string[];
}

export interface ApiaryState {
  apiarioId: string | null;
  name: string;
  hiveCount: number;
  riskSummary: Record<RiskLevel, number>;
  worstRisk: RiskLevel;
  ambientTempC: number | null;
  alertsNearby: number;
  hives: HiveState[];
}

// Three.js acepta hsl(); los canales son los primitivos de tokens.css.
export const RISK_COLORS: Record<RiskLevel, string> = {
  ok: 'hsl(145 63% 42%)',
  watch: 'hsl(44 85% 46%)',
  alert: 'hsl(38 92% 50%)',
  critical: 'hsl(0 72% 51%)',
  unknown: 'hsl(35 15% 45%)',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  ok: 'Estable',
  watch: 'Vigilancia',
  alert: 'Atención',
  critical: 'Crítico',
  unknown: 'Sin datos',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseHealth(raw: string | null | undefined): HiveState['health'] {
  if (!raw) return null;
  if (raw === 'optimal' || raw === 'optima') return 'optimal';
  if (raw === 'attention' || raw === 'atencion') return 'attention';
  if (raw === 'risk' || raw === 'riesgo') return 'risk';
  return null;
}

function sortByDateDesc<T extends { date?: string | null; created_at?: string | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const da = a.date || a.created_at || '';
    const db = b.date || b.created_at || '';
    return db.localeCompare(da);
  });
}

function daysBetween(isoDate: string, now: Date): number {
  const t = Date.parse(isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00`);
  if (Number.isNaN(t)) return 0;
  return Math.floor((now.getTime() - t) / (1000 * 60 * 60 * 24));
}

function lastPeso(records: PesoRow[] | undefined): { kg: number; date: string } | null {
  if (!records?.length) return null;
  const sorted = sortByDateDesc(records);
  const row = sorted[0];
  if (row == null || typeof row.kg !== 'number') return null;
  return { kg: row.kg, date: row.date || row.created_at || '' };
}

function weightTrendFrom(records: PesoRow[] | undefined): WeightTrend {
  if (!records || records.length < 2) return records?.length === 1 ? 'flat' : 'unknown';
  const sorted = sortByDateDesc(records);
  const a = sorted[0]?.kg;
  const b = sorted[1]?.kg;
  if (typeof a !== 'number' || typeof b !== 'number' || b === 0) return 'unknown';
  const delta = (a - b) / Math.abs(b);
  if (delta > 0.03) return 'up';
  if (delta < -0.03) return 'down';
  return 'flat';
}

function lastVarroa(
  records: VarroaRow[] | undefined,
  inspecciones: InspeccionRow[] | undefined,
): { level: number; date: string; source: SignalSource } | null {
  const fromRec = records?.length ? sortByDateDesc(records)[0] : null;
  if (fromRec && typeof fromRec.level === 'number') {
    return {
      level: fromRec.level,
      date: fromRec.date || fromRec.created_at || '',
      source: 'record',
    };
  }
  const withVarroa = (inspecciones ?? [])
    .filter((i) => typeof i.varroa === 'number')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const ins = withVarroa[0];
  if (ins && typeof ins.varroa === 'number') {
    return { level: ins.varroa, date: ins.date, source: 'inspection' };
  }
  return null;
}

function lastInspection(inspecciones: InspeccionRow[] | undefined, lastInspectionCol: string | null) {
  if (inspecciones?.length) {
    const sorted = sortByDateDesc(inspecciones);
    return sorted[0] ?? null;
  }
  if (lastInspectionCol) {
    return {
      date: lastInspectionCol,
      reina: null,
      enjambrazon_riesgo: null,
    } as Pick<InspeccionRow, 'date' | 'reina' | 'enjambrazon_riesgo'>;
  }
  return null;
}

/** Distancia haversine en km. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function countAlertsNearby(
  apiarioLat: number | null | undefined,
  apiarioLng: number | null | undefined,
  alerts: TerritorialAlertInput[] | undefined,
  now: Date = new Date(),
): number {
  if (
    apiarioLat == null ||
    apiarioLng == null ||
    !Number.isFinite(apiarioLat) ||
    !Number.isFinite(apiarioLng) ||
    !alerts?.length
  ) {
    return 0;
  }
  return alerts.filter((a) => {
    if (a.estado && a.estado !== 'activa' && a.estado !== 'programada') return false;
    if (a.lat_aproximada == null || a.lng_aproximada == null) return false;
    if (a.fecha_programada) {
      const fp = Date.parse(a.fecha_programada);
      // Ignorar alertas programadas hace más de 14 días
      if (!Number.isNaN(fp) && now.getTime() - fp > 14 * 24 * 60 * 60 * 1000) return false;
    }
    const d = haversineKm(apiarioLat, apiarioLng, a.lat_aproximada, a.lng_aproximada);
    const radio = typeof a.radio_km === 'number' && a.radio_km > 0 ? a.radio_km : 3;
    return d <= radio;
  }).length;
}

function scoreToRisk(score: number, hasAnySignal: boolean): RiskLevel {
  if (!hasAnySignal) return 'unknown';
  if (score >= 70) return 'critical';
  if (score >= 45) return 'alert';
  if (score >= 20) return 'watch';
  return 'ok';
}

function buildPrimaryAction(parts: {
  risk: RiskLevel;
  varroaLevel: number | null;
  daysSinceInspection: number | null;
  queenPresent: boolean | null;
  weightTrend: WeightTrend;
  alertsNearby: number;
  missingSignals: string[];
}): string | null {
  if (parts.queenPresent === false) return 'Revisar reina / requeen o unir';
  if (parts.varroaLevel != null && parts.varroaLevel >= VARROA_THRESHOLDS.critical) {
    return 'Tratamiento varroa urgente';
  }
  if (parts.varroaLevel != null && parts.varroaLevel >= VARROA_THRESHOLDS.alert) {
    return 'Programar control de varroa';
  }
  if (parts.alertsNearby > 0) return 'Resguardo: alerta fitosanitaria cercana';
  if (parts.daysSinceInspection != null && parts.daysSinceInspection >= INSPECTION_STALE_DAYS.alert) {
    return 'Inspección atrasada (+60 d)';
  }
  if (parts.weightTrend === 'down') return 'Revisar reservas / peso en baja';
  if (parts.daysSinceInspection != null && parts.daysSinceInspection >= INSPECTION_STALE_DAYS.watch) {
    return 'Programar visita de campo';
  }
  if (parts.missingSignals.includes('varroa') && parts.missingSignals.includes('peso')) {
    return 'Registrar peso y varroa en bitácora';
  }
  if (parts.risk === 'ok') return null;
  return 'Revisar ficha de colmena';
}

// ─── Core builder ───────────────────────────────────────────────────────────

export function buildHiveState(
  colmena: ColmenaWithRelations,
  ctx: HiveStateContext = {},
): HiveState {
  const now = ctx.now ?? new Date();
  const missing: string[] = [];

  const peso = lastPeso(colmena.peso_records);
  const weightKg = peso?.kg ?? null;
  const weightDate = peso?.date || null;
  const weightTrend = weightTrendFrom(colmena.peso_records);
  if (weightKg == null) missing.push('peso');

  const varroa = lastVarroa(colmena.varroa_records, colmena.inspecciones);
  const varroaLevel = varroa?.level ?? null;
  const varroaDate = varroa?.date || null;
  const varroaSource: SignalSource = varroa?.source ?? 'missing';
  if (varroaLevel == null) missing.push('varroa');

  const health = parseHealth(colmena.health);
  if (!health) missing.push('health');

  const insp = lastInspection(colmena.inspecciones, colmena.last_inspection);
  const lastInspectionDate = insp?.date ?? null;
  const daysSinceInspection =
    lastInspectionDate != null ? daysBetween(lastInspectionDate, now) : null;
  if (lastInspectionDate == null) missing.push('inspeccion');

  const queenPresent =
    typeof insp?.reina === 'boolean' ? insp.reina : colmena.queen != null ? true : null;
  const enjambrazonRiesgo = insp?.enjambrazon_riesgo ?? null;

  const ambientTempC =
    typeof ctx.ambientTempC === 'number' && Number.isFinite(ctx.ambientTempC)
      ? ctx.ambientTempC
      : null;

  const alertsNearby = countAlertsNearby(
    ctx.apiarioLat ?? colmena.lat,
    ctx.apiarioLng ?? colmena.lng,
    ctx.territorialAlerts,
    now,
  );

  // ── Score 0–100 (más alto = peor) ───────────────────────────────────────
  let score = 0;
  const reasons: string[] = [];

  if (health === 'risk') {
    score += 40;
    reasons.push('health=risk');
  } else if (health === 'attention') {
    score += 20;
    reasons.push('health=attention');
  }

  if (varroaLevel != null) {
    if (varroaLevel >= VARROA_THRESHOLDS.critical) {
      score += 35;
      reasons.push('varroa critical');
    } else if (varroaLevel >= VARROA_THRESHOLDS.alert) {
      score += 25;
      reasons.push('varroa alert');
    } else if (varroaLevel >= VARROA_THRESHOLDS.watch) {
      score += 12;
      reasons.push('varroa watch');
    }
  } else if (varroaDate == null) {
    // sin dato reciente no castiga fuerte; solo leve si no hay nada
    score += 5;
  }

  if (varroaDate) {
    const d = daysBetween(varroaDate, now);
    if (d >= VARROA_STALE_DAYS) {
      score += 10;
      reasons.push('varroa stale');
    }
  }

  if (daysSinceInspection != null) {
    if (daysSinceInspection >= INSPECTION_STALE_DAYS.alert) {
      score += 25;
      reasons.push('inspection >60d');
    } else if (daysSinceInspection >= INSPECTION_STALE_DAYS.watch) {
      score += 15;
      reasons.push('inspection >30d');
    }
  } else {
    score += 12;
    reasons.push('no inspection');
  }

  if (queenPresent === false) {
    score += 40;
    reasons.push('no queen');
  }

  if (weightTrend === 'down' && colmena.peso_records && colmena.peso_records.length >= 2) {
    const sorted = sortByDateDesc(colmena.peso_records);
    const a = sorted[0]?.kg;
    const b = sorted[1]?.kg;
    if (typeof a === 'number' && typeof b === 'number' && b > 0) {
      const drop = (b - a) / b;
      if (drop >= WEIGHT_DROP_ALERT) {
        score += 15;
        reasons.push('weight drop');
      }
    }
  }

  if (enjambrazonRiesgo === 'alto' || enjambrazonRiesgo === 'high') {
    score += 10;
    reasons.push('swarm risk');
  } else if (enjambrazonRiesgo === 'medio' || enjambrazonRiesgo === 'medium') {
    score += 5;
  }

  if (alertsNearby > 0) {
    score += Math.min(25, 15 + alertsNearby * 5);
    reasons.push('phytosanitary nearby');
  }

  score = Math.max(0, Math.min(100, score));

  const hasAnySignal =
    health != null ||
    varroaLevel != null ||
    weightKg != null ||
    lastInspectionDate != null ||
    alertsNearby > 0;

  const risk = scoreToRisk(score, hasAnySignal);

  let signalQuality: HiveState['signalQuality'] = 'sparse';
  const present = 4 - missing.filter((m) => ['peso', 'varroa', 'health', 'inspeccion'].includes(m)).length;
  if (present >= 3) signalQuality = 'rich';
  else if (present >= 2) signalQuality = 'partial';

  const primaryAction = buildPrimaryAction({
    risk,
    varroaLevel,
    daysSinceInspection,
    queenPresent,
    weightTrend,
    alertsNearby,
    missingSignals: missing,
  });

  return {
    id: colmena.id,
    name: colmena.name,
    apiarioId: colmena.apiario_id,
    apiarioName: colmena.apiario_name,
    risk,
    riskScore: score,
    riskLabel: RISK_LABELS[risk],
    color: RISK_COLORS[risk],
    weightKg: weightKg != null ? Math.round(weightKg * 10) / 10 : null,
    weightDate,
    weightTrend,
    varroaLevel,
    varroaDate,
    varroaSource,
    health,
    lastInspectionDate,
    daysSinceInspection,
    queenPresent,
    enjambrazonRiesgo,
    ambientTempC,
    floracion: colmena.floracion ?? null,
    loteActivo: colmena.lote_activo ?? null,
    productionTotalKg: colmena.production_total ?? null,
    alertsNearby,
    primaryAction,
    signalQuality,
    missingSignals: missing,
  };
}

export function buildApiaryState(
  colmenas: ColmenaWithRelations[],
  opts: {
    apiarioId?: string | null;
    apiarioName?: string;
    ctx?: HiveStateContext;
  } = {},
): ApiaryState {
  const ctx = opts.ctx ?? {};
  const hives = colmenas.map((c) => buildHiveState(c, ctx));
  const riskSummary: Record<RiskLevel, number> = {
    ok: 0,
    watch: 0,
    alert: 0,
    critical: 0,
    unknown: 0,
  };
  for (const h of hives) riskSummary[h.risk] += 1;

  const order: RiskLevel[] = ['critical', 'alert', 'watch', 'unknown', 'ok'];
  const worstRisk = order.find((r) => riskSummary[r] > 0) ?? 'unknown';

  const alertsNearby = Math.max(0, ...hives.map((h) => h.alertsNearby), 0);

  return {
    apiarioId: opts.apiarioId ?? colmenas[0]?.apiario_id ?? null,
    name: opts.apiarioName ?? colmenas[0]?.apiario_name ?? 'Apiario',
    hiveCount: hives.length,
    riskSummary,
    worstRisk,
    ambientTempC: ctx.ambientTempC ?? hives[0]?.ambientTempC ?? null,
    alertsNearby,
    hives,
  };
}

/** Etiqueta corta para overlay 3D (sin inventar temp de colmena). */
export function hiveStateLabel(state: HiveState): string {
  const parts: string[] = [state.riskLabel];
  if (state.weightKg != null) parts.push(`${state.weightKg} kg`);
  else if (state.varroaLevel != null) parts.push(`V ${state.varroaLevel}`);
  return parts.join(' · ');
}
