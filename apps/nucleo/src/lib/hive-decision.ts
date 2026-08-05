/**
 * Capa de decisión mínima sobre HiveState.
 * No es ML: escenarios documentados + feed priorizado de acciones del patio.
 * Misma honestidad: proyecta sobre señales existentes, no inventa sensores.
 */

import type { HiveState, RiskLevel } from './hive-state';
import { RISK_COLORS, RISK_LABELS, VARROA_THRESHOLDS, INSPECTION_STALE_DAYS } from './hive-state';

export type ScenarioId =
  | 'ignore_varroa_30d'
  | 'skip_visit_30d'
  | 'treat_varroa'
  | 'phytosanitary_hit'
  | 'weight_keeps_dropping';

export interface ScenarioDef {
  id: ScenarioId;
  label: string;
  /** Texto corto para UI */
  hint: string;
}

export const SCENARIOS: ScenarioDef[] = [
  {
    id: 'ignore_varroa_30d',
    label: 'Sin tratar varroa (30 d)',
    hint: 'Si no actuás sobre el ácaro en un mes',
  },
  {
    id: 'skip_visit_30d',
    label: 'Sin visita de campo (30 d)',
    hint: 'Si no abrís la colmena en un mes',
  },
  {
    id: 'treat_varroa',
    label: 'Tratar varroa ahora',
    hint: 'Escenario de control efectivo',
  },
  {
    id: 'phytosanitary_hit',
    label: 'Fumigación cercana',
    hint: 'Nueva alerta fitosanitaria en radio',
  },
  {
    id: 'weight_keeps_dropping',
    label: 'Peso sigue bajando',
    hint: 'Tendencia de peso sin corrección',
  },
];

export interface ScenarioProjection {
  scenario: ScenarioId;
  label: string;
  baseline: { score: number; risk: RiskLevel };
  projected: { score: number; risk: RiskLevel };
  deltaScore: number;
  /** Mejor = score baja; peor = score sube */
  direction: 'better' | 'worse' | 'same';
  narrative: string;
  color: string;
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreToRisk(score: number, baselineUnknown: boolean): RiskLevel {
  if (baselineUnknown && score < 20) return 'unknown';
  if (score >= 70) return 'critical';
  if (score >= 45) return 'alert';
  if (score >= 20) return 'watch';
  return 'ok';
}

/**
 * Proyecta un escenario sobre el estado actual (delta de score, no re-simula biología).
 */
export function projectHiveScenario(state: HiveState, scenario: ScenarioId): ScenarioProjection {
  const baselineScore = state.riskScore;
  const baselineRisk = state.risk;
  const unknown = baselineRisk === 'unknown';
  let delta = 0;
  let narrative = '';

  switch (scenario) {
    case 'ignore_varroa_30d': {
      if (state.varroaLevel != null && state.varroaLevel >= VARROA_THRESHOLDS.critical) {
        delta = 25;
        narrative = 'Varroa ya crítica: sin tratamiento el colapso se acelera.';
      } else if (state.varroaLevel != null && state.varroaLevel >= VARROA_THRESHOLDS.alert) {
        delta = 20;
        narrative = 'Varroa en umbral de alerta: en 30 d sin control suele pasar a crítica.';
      } else if (state.varroaLevel != null && state.varroaLevel >= VARROA_THRESHOLDS.watch) {
        delta = 15;
        narrative = 'Varroa en vigilancia: sin acción puede cruzar el umbral de tratamiento.';
      } else if (state.varroaLevel == null) {
        delta = 12;
        narrative = 'Sin medición de varroa: la incertidumbre crece si no muestreás.';
      } else {
        delta = 6;
        narrative = 'Varroa baja hoy: el riesgo sube poco, pero el monitoreo no sobra.';
      }
      break;
    }
    case 'skip_visit_30d': {
      const days = state.daysSinceInspection ?? 45;
      if (days >= INSPECTION_STALE_DAYS.alert) {
        delta = 18;
        narrative = 'Ya llevás +60 d sin visita: otros 30 d dejan la colmena a ciegas.';
      } else if (days >= INSPECTION_STALE_DAYS.watch) {
        delta = 14;
        narrative = 'Visita ya atrasada: posponer un mes eleva riesgo de reina/varroa/reservas.';
      } else {
        delta = 10;
        narrative = 'Sin apertura en 30 d perdés señales de reina, cría y reservas.';
      }
      break;
    }
    case 'treat_varroa': {
      if (state.varroaLevel != null && state.varroaLevel >= VARROA_THRESHOLDS.alert) {
        delta = -28;
        narrative = 'Control efectivo bajaría el score de riesgo sanitario de forma clara.';
      } else if (state.varroaLevel != null && state.varroaLevel >= VARROA_THRESHOLDS.watch) {
        delta = -14;
        narrative = 'Tratamiento preventivo reduce la presión antes del umbral crítico.';
      } else if (state.varroaLevel == null) {
        delta = -5;
        narrative = 'Sin baseline de varroa el beneficio es incierto: medí y después tratá.';
      } else {
        delta = -4;
        narrative = 'Carga baja: tratamiento aporta poco; priorizá monitoreo.';
      }
      break;
    }
    case 'phytosanitary_hit': {
      if (state.alertsNearby > 0) {
        delta = 12;
        narrative = 'Ya hay alerta en radio: otra aplicación acumula exposición.';
      } else {
        delta = 20;
        narrative = 'Fumigación en zona: resguardo, no abrir y avisar trashumancia si aplica.';
      }
      break;
    }
    case 'weight_keeps_dropping': {
      if (state.weightTrend === 'down') {
        delta = 18;
        narrative = 'El peso ya baja: si sigue, riesgo de inanición o pérdida de colonia.';
      } else if (state.weightKg == null) {
        delta = 10;
        narrative = 'Sin serie de peso no ves la caída: registrá kg en bitácora.';
      } else {
        delta = 12;
        narrative = 'Una tendencia a la baja sostenida exige revisar reservas y floración.';
      }
      break;
    }
    default:
      narrative = 'Escenario no modelado.';
  }

  const projectedScore = clampScore(baselineScore + delta);
  const projectedRisk = scoreToRisk(projectedScore, unknown && delta >= 0);
  const direction: ScenarioProjection['direction'] =
    delta > 0 ? 'worse' : delta < 0 ? 'better' : 'same';

  const def = SCENARIOS.find((s) => s.id === scenario);
  return {
    scenario,
    label: def?.label ?? scenario,
    baseline: { score: baselineScore, risk: baselineRisk },
    projected: { score: projectedScore, risk: projectedRisk },
    deltaScore: delta,
    direction,
    narrative,
    color: RISK_COLORS[projectedRisk],
  };
}

export function projectAllScenarios(state: HiveState): ScenarioProjection[] {
  return SCENARIOS.map((s) => projectHiveScenario(state, s.id));
}

// ─── Feed de acciones del patio ─────────────────────────────────────────────

export interface YardActionItem {
  colmenaId: string;
  name: string;
  action: string;
  risk: RiskLevel;
  riskScore: number;
  riskLabel: string;
  color: string;
  /** 0 = más urgente */
  priority: number;
}

const RISK_PRIORITY: Record<RiskLevel, number> = {
  critical: 0,
  alert: 1,
  watch: 2,
  unknown: 3,
  ok: 4,
};

/**
 * Lista priorizada de acciones del patio (solo colmenas con primaryAction o riesgo alto).
 */
export function buildYardActionFeed(hives: HiveState[], limit = 8): YardActionItem[] {
  const items: YardActionItem[] = hives
    .filter((h) => h.primaryAction != null || h.risk === 'critical' || h.risk === 'alert')
    .map((h) => ({
      colmenaId: h.id,
      name: h.name,
      action: h.primaryAction ?? `Revisar — estado ${RISK_LABELS[h.risk]}`,
      risk: h.risk,
      riskScore: h.riskScore,
      riskLabel: h.riskLabel,
      color: h.color,
      priority: RISK_PRIORITY[h.risk] * 1000 - h.riskScore,
    }));

  items.sort((a, b) => a.priority - b.priority || b.riskScore - a.riskScore);
  return items.slice(0, limit);
}

export function yardFeedSummary(hives: HiveState[]): {
  total: number;
  needingAction: number;
  worstRisk: RiskLevel;
} {
  const feed = buildYardActionFeed(hives, 100);
  const order: RiskLevel[] = ['critical', 'alert', 'watch', 'unknown', 'ok'];
  let worst: RiskLevel = 'ok';
  for (const r of order) {
    if (hives.some((h) => h.risk === r)) {
      worst = r;
      break;
    }
  }
  if (hives.length === 0) worst = 'unknown';
  return {
    total: hives.length,
    needingAction: feed.length,
    worstRisk: worst,
  };
}
