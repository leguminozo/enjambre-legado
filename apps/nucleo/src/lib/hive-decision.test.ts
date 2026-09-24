import { describe, expect, it } from 'vitest';
import {
  buildYardActionFeed,
  projectAllScenarios,
  projectHiveScenario,
  yardFeedSummary,
} from './hive-decision';
import type { HiveState } from './hive-state';

function hive(over: Partial<HiveState> = {}): HiveState {
  return {
    id: 'c1',
    name: 'Ulmo',
    apiarioId: 'a1',
    risk: 'watch',
    riskScore: 30,
    riskLabel: 'Vigilancia',
    color: 'hsl(44 85% 46%)',
    alzas: 1,
    poblacion: 'alta',
    queenStatus: 'activa',
    queenLabel: 'Reina activa',
    weightKg: 40,
    weightDate: '2026-07-01',
    weightTrend: 'flat',
    varroaLevel: 2.5,
    varroaDate: '2026-07-01',
    varroaSource: 'record',
    health: 'attention',
    lastInspectionDate: '2026-07-01',
    daysSinceInspection: 20,
    queenPresent: true,
    enjambrazonRiesgo: 'bajo',
    ambientTempC: 12,
    floracion: 'ulmo',
    loteActivo: null,
    productionTotalKg: 20,
    alertsNearby: 0,
    primaryAction: 'Programar control de varroa',
    signalQuality: 'partial',
    missingSignals: [],
    ...over,
  };
}

describe('projectHiveScenario', () => {
  it('ignorar varroa en alerta empeora el score', () => {
    const p = projectHiveScenario(hive({ varroaLevel: 3.2, riskScore: 40, risk: 'alert' }), 'ignore_varroa_30d');
    expect(p.direction).toBe('worse');
    expect(p.projected.score).toBeGreaterThan(p.baseline.score);
  });

  it('tratar varroa alta mejora el score', () => {
    const p = projectHiveScenario(
      hive({ varroaLevel: 4.5, riskScore: 75, risk: 'critical' }),
      'treat_varroa',
    );
    expect(p.direction).toBe('better');
    expect(p.deltaScore).toBeLessThan(0);
  });

  it('fumigación sube riesgo', () => {
    const p = projectHiveScenario(hive({ alertsNearby: 0, riskScore: 10, risk: 'ok' }), 'phytosanitary_hit');
    expect(p.direction).toBe('worse');
    expect(p.projected.risk).not.toBe('ok');
  });

  it('projectAllScenarios devuelve 5', () => {
    expect(projectAllScenarios(hive())).toHaveLength(5);
  });
});

describe('buildYardActionFeed', () => {
  it('prioriza critical sobre watch', () => {
    const feed = buildYardActionFeed([
      hive({ id: 'a', name: 'A', risk: 'watch', riskScore: 25, primaryAction: 'Visita' }),
      hive({
        id: 'b',
        name: 'B',
        risk: 'critical',
        riskScore: 80,
        primaryAction: 'Tratamiento varroa urgente',
      }),
    ]);
    expect(feed[0]?.colmenaId).toBe('b');
    expect(feed[0]?.action).toMatch(/varroa/i);
  });

  it('yardFeedSummary cuenta acciones', () => {
    const s = yardFeedSummary([
      hive({ risk: 'ok', riskScore: 5, primaryAction: null }),
      hive({ id: 'x', risk: 'alert', riskScore: 50, primaryAction: 'X' }),
    ]);
    expect(s.total).toBe(2);
    expect(s.needingAction).toBe(1);
    expect(s.worstRisk).toBe('alert');
  });
});
