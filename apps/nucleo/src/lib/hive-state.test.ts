import { describe, expect, it } from 'vitest';
import {
  buildHiveState,
  buildApiaryState,
  countAlertsNearby,
  haversineKm,
  hiveStateLabel,
  VARROA_THRESHOLDS,
} from './hive-state';
import type { ColmenaWithRelations } from './apicultor-types';

const NOW = new Date('2026-08-04T12:00:00Z');

function baseColmena(over: Partial<ColmenaWithRelations> = {}): ColmenaWithRelations {
  return {
    id: 'c1',
    name: 'Ulmo Norte',
    apiario_id: 'a1',
    apiario_name: 'Pureo',
    health: 'optimal',
    alzas: 1,
    blockchain_hash: null,
    created_at: '2026-01-01',
    updated_at: null,
    floracion: 'ulmo',
    last_inspection: '2026-07-20',
    lote_activo: null,
    notes: null,
    nucleos_candidatos: false,
    origen_colmena_madre: null,
    origen_detalle: null,
    origen_fecha: null,
    origen_tipo: null,
    production_total: 40,
    queen: '2025-11-01',
    user_id: null,
    lat: -42.48,
    lng: -73.72,
    peso_records: [
      { id: 'p2', colmena_id: 'c1', date: '2026-07-28', kg: 42, note: null, created_at: null, user_id: null },
      { id: 'p1', colmena_id: 'c1', date: '2026-07-10', kg: 40, note: null, created_at: null, user_id: null },
    ],
    varroa_records: [
      { id: 'v1', colmena_id: 'c1', date: '2026-07-20', level: 1.2, method: 'alcohol', created_at: null, user_id: null },
    ],
    inspecciones: [
      {
        id: 'i1',
        colmena_id: 'c1',
        date: '2026-07-20',
        enjambrazon_riesgo: 'bajo',
        fase: null,
        foto_url: null,
        inspector: 'Cristina',
        marcos_cria: 7,
        marcos_miel: 5,
        notes: null,
        poblacion: 'alta',
        reina: true,
        user_id: null,
        varroa: 1.2,
        created_at: null,
      },
    ],
    ...over,
  };
}

describe('haversineKm', () => {
  it('distancia ~0 para mismo punto', () => {
    expect(haversineKm(-42.48, -73.72, -42.48, -73.72)).toBeCloseTo(0, 5);
  });

  it('distancia razonable entre Pureo y ~3 km', () => {
    // ~0.027° lat ≈ 3 km
    const d = haversineKm(-42.48, -73.72, -42.48 + 0.027, -73.72);
    expect(d).toBeGreaterThan(2.5);
    expect(d).toBeLessThan(3.5);
  });
});

describe('buildHiveState', () => {
  it('colmena estable con señales ricas → ok / rich', () => {
    const s = buildHiveState(baseColmena(), { now: NOW, ambientTempC: 12 });
    expect(s.risk).toBe('ok');
    expect(s.signalQuality).toBe('rich');
    expect(s.weightKg).toBe(42);
    expect(s.weightTrend).toBe('up');
    expect(s.varroaLevel).toBe(1.2);
    expect(s.ambientTempC).toBe(12);
    expect(s.primaryAction).toBeNull();
    expect(s.missingSignals).toEqual([]);
  });

  it('varroa alta → critical y acción de tratamiento', () => {
    const s = buildHiveState(
      baseColmena({
        health: 'risk',
        varroa_records: [
          {
            id: 'v',
            colmena_id: 'c1',
            date: '2026-07-30',
            level: VARROA_THRESHOLDS.critical + 0.5,
            method: null,
            created_at: null,
            user_id: null,
          },
        ],
      }),
      { now: NOW },
    );
    expect(s.risk).toBe('critical');
    expect(s.primaryAction).toMatch(/varroa|Tratamiento/i);
  });

  it('sin reina → acción requeen', () => {
    const s = buildHiveState(
      baseColmena({
        inspecciones: [
          {
            id: 'i1',
            colmena_id: 'c1',
            date: '2026-07-20',
            enjambrazon_riesgo: 'bajo',
            fase: null,
            foto_url: null,
            inspector: null,
            marcos_cria: 1,
            marcos_miel: 1,
            notes: null,
            poblacion: 'baja',
            reina: false,
            user_id: null,
            varroa: 2,
            created_at: null,
          },
        ],
      }),
      { now: NOW },
    );
    expect(s.queenPresent).toBe(false);
    expect(s.primaryAction).toMatch(/reina|requeen/i);
    expect(s.riskScore).toBeGreaterThanOrEqual(40);
  });

  it('sin señales → unknown / sparse', () => {
    const s = buildHiveState(
      baseColmena({
        health: null,
        last_inspection: null,
        peso_records: [],
        varroa_records: [],
        inspecciones: [],
      }),
      { now: NOW },
    );
    expect(s.risk).toBe('unknown');
    expect(s.signalQuality).toBe('sparse');
    expect(s.missingSignals).toContain('peso');
    expect(s.missingSignals).toContain('varroa');
  });

  it('caída de peso fuerte suma riesgo', () => {
    const s = buildHiveState(
      baseColmena({
        peso_records: [
          { id: 'p2', colmena_id: 'c1', date: '2026-07-28', kg: 30, note: null, created_at: null, user_id: null },
          { id: 'p1', colmena_id: 'c1', date: '2026-07-10', kg: 40, note: null, created_at: null, user_id: null },
        ],
      }),
      { now: NOW },
    );
    expect(s.weightTrend).toBe('down');
    expect(s.riskScore).toBeGreaterThan(0);
  });

  it('varroa desde inspección si no hay records', () => {
    const s = buildHiveState(
      baseColmena({
        varroa_records: [],
        inspecciones: [
          {
            id: 'i1',
            colmena_id: 'c1',
            date: '2026-07-15',
            enjambrazon_riesgo: null,
            fase: null,
            foto_url: null,
            inspector: null,
            marcos_cria: null,
            marcos_miel: null,
            notes: null,
            poblacion: null,
            reina: true,
            user_id: null,
            varroa: 2.5,
            created_at: null,
          },
        ],
      }),
      { now: NOW },
    );
    expect(s.varroaLevel).toBe(2.5);
    expect(s.varroaSource).toBe('inspection');
  });

  it('alerta fitosanitaria cercana eleva score y acción', () => {
    const s = buildHiveState(baseColmena(), {
      now: NOW,
      apiarioLat: -42.48,
      apiarioLng: -73.72,
      territorialAlerts: [
        {
          lat_aproximada: -42.48,
          lng_aproximada: -73.72,
          radio_km: 5,
          estado: 'activa',
          fecha_programada: '2026-08-03',
        },
      ],
    });
    expect(s.alertsNearby).toBe(1);
    expect(s.primaryAction).toMatch(/fitosanitaria|Resguardo/i);
    expect(s.riskScore).toBeGreaterThanOrEqual(15);
  });

  it('alzas se extraen correctamente con soporte para 0, 1, 2+ y fallback biológico a 0 (cámara única)', () => {
    const s0 = buildHiveState(baseColmena({ alzas: 0 }));
    expect(s0.alzas).toBe(0);

    const s2 = buildHiveState(baseColmena({ alzas: 2 }));
    expect(s2.alzas).toBe(2);

    const sNull = buildHiveState(baseColmena({ alzas: null }));
    expect(sNull.alzas).toBe(0);
  });

  it('población y queenStatus se determinan según inspecciones y señales biológicas', () => {
    // Reina activa explícita
    const sActiva = buildHiveState(baseColmena({ queen: 'Fecundada 2025' }));
    expect(sActiva.queenStatus).toBe('activa');
    expect(sActiva.queenLabel).toContain('Reina activa');
    expect(sActiva.poblacion).toBe('alta');

    // Huérfana explícita
    const sHuerfana = buildHiveState(
      baseColmena({
        queen: null,
        inspecciones: [
          {
            id: 'i2',
            colmena_id: 'c1',
            date: '2026-08-01',
            reina: false,
            marcos_cria: 0,
            marcos_miel: 2,
            poblacion: 'debil',
            enjambrazon_riesgo: null,
            fase: null,
            foto_url: null,
            inspector: null,
            notes: null,
            user_id: null,
            varroa: null,
            created_at: null,
          },
        ],
      }),
    );
    expect(sHuerfana.queenStatus).toBe('huerfana');
    expect(sHuerfana.queenLabel).toBe('Sin reina (huérfana)');
    expect(sHuerfana.poblacion).toBe('debil');

    // Implícita por presencia de cría
    const sImplicita = buildHiveState(
      baseColmena({
        queen: null,
        inspecciones: [
          {
            id: 'i3',
            colmena_id: 'c1',
            date: '2026-08-01',
            reina: null,
            marcos_cria: 5,
            marcos_miel: 4,
            poblacion: 'media',
            enjambrazon_riesgo: null,
            fase: null,
            foto_url: null,
            inspector: null,
            notes: null,
            user_id: null,
            varroa: null,
            created_at: null,
          },
        ],
      }),
    );
    expect(sImplicita.queenStatus).toBe('implicita');
    expect(sImplicita.queenLabel).toBe('Implícita (cría fresca)');
    expect(sImplicita.poblacion).toBe('media');
  });
});

describe('countAlertsNearby', () => {
  it('fuera de radio no cuenta', () => {
    const n = countAlertsNearby(-42.48, -73.72, [
      {
        lat_aproximada: -41.0,
        lng_aproximada: -73.0,
        radio_km: 2,
        estado: 'activa',
      },
    ], NOW);
    expect(n).toBe(0);
  });
});

describe('buildApiaryState + label', () => {
  it('resume worst risk del patio', () => {
    const ok = baseColmena({ id: 'c1', name: 'A' });
    const bad = baseColmena({
      id: 'c2',
      name: 'B',
      health: 'risk',
      varroa_records: [
        {
          id: 'v',
          colmena_id: 'c2',
          date: '2026-07-30',
          level: 5,
          method: null,
          created_at: null,
          user_id: null,
        },
      ],
    });
    const apiary = buildApiaryState([ok, bad], {
      apiarioName: 'Pureo',
      ctx: { now: NOW },
    });
    expect(apiary.hiveCount).toBe(2);
    expect(apiary.worstRisk).toBe('critical');
    expect(apiary.riskSummary.ok).toBe(1);
    expect(hiveStateLabel(apiary.hives[0]!)).toMatch(/Estable|kg/);
  });
});
