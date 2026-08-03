import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  gddDiario,
  agruparEspeciesPorTbase,
  gddHistoricoAcumulado,
  proyectarFloracion,
} from '@/api/lib/fenologia';

const especieBase = {
  id: 'esp-1',
  nombre_cientifico: 'Eucryphia cordifolia',
  nombre_comun: 'Ulmo',
  tbase_c: 5,
  gdd_umbral: 100,
  ventana_ini: null,
  ventana_fin: null,
};

const historico80 = { acumulado: 80 };
const pronostico25 = {
  serie: [
    { fecha: '2026-08-04', gdd: 5, acumulado: 5 },
    { fecha: '2026-08-05', gdd: 6, acumulado: 11 },
    { fecha: '2026-08-06', gdd: 14, acumulado: 25 },
  ],
  acumulado: 25,
};

describe('gddDiario', () => {
  it('acumula la media sobre la Tbase', () => {
    expect(gddDiario(12, 4, 5)).toBe(3); // (12+4)/2 - 5
  });

  it('clampa a 0 cuando la media no supera la Tbase', () => {
    expect(gddDiario(8, 2, 5)).toBe(0);
  });

  it('trata valores nulos como 0 (series incompletas)', () => {
    expect(gddDiario(null, 4, 5)).toBe(0);
    expect(gddDiario(12, null, 5)).toBe(0);
  });
});

describe('agruparEspeciesPorTbase', () => {
  it('agrupa especies por Tbase distinta', () => {
    const grupos = agruparEspeciesPorTbase([
      { id: 'a', tbase_c: 5 },
      { id: 'b', tbase_c: 10 },
      { id: 'c', tbase_c: 5 },
    ]);
    expect([...grupos.keys()].sort((a, b) => a - b)).toEqual([5, 10]);
    expect(grupos.get(5)?.map((e) => e.id)).toEqual(['a', 'c']);
  });

  it('normaliza Tbase string (NUMERIC de Postgres) y null a 5', () => {
    const grupos = agruparEspeciesPorTbase([
      { id: 'a', tbase_c: '5.0' },
      { id: 'b', tbase_c: null },
      { id: 'c', tbase_c: undefined },
    ]);
    expect(grupos.size).toBe(1);
    expect(grupos.get(5)?.length).toBe(3);
  });
});

describe('proyectarFloracion', () => {
  it('estima días hasta cruzar el umbral dentro del horizonte', () => {
    const p = proyectarFloracion(especieBase, historico80, pronostico25);
    expect(p.gddActual).toBe(80);
    expect(p.gddUmbral).toBe(100);
    expect(p.progreso).toBe(80);
    expect(p.diasEstimados).toBe(3); // 80 + 25 >= 100 el día 3
    expect(p.enFloracion).toBe(false);
  });

  it('marca enFloracion cuando el acumulado ya supera el umbral', () => {
    const p = proyectarFloracion(especieBase, { acumulado: 120 }, pronostico25);
    expect(p.enFloracion).toBe(true);
    expect(p.diasEstimados).toBe(0);
  });

  it('no estima fecha con umbral sin calibrar', () => {
    const p = proyectarFloracion(
      { ...especieBase, gdd_umbral: null },
      historico80,
      pronostico25,
    );
    expect(p.gddUmbral).toBeNull();
    expect(p.enFloracion).toBe(false);
    expect(p.diasEstimados).toBeNull();
    // La proyección a 16 días es independiente del umbral: 80 + 25
    expect(p.gddProyectado16d).toBe(105);
  });

  it('respeta la ventana fenológica que cruza año (oct–mar)', () => {
    const esp = { ...especieBase, ventana_ini: 10, ventana_fin: 3 };
    const enDiciembre = proyectarFloracion(esp, historico80, pronostico25, new Date('2026-12-15'));
    const enJunio = proyectarFloracion(esp, historico80, pronostico25, new Date('2026-06-15'));
    expect(enDiciembre.enVentana).toBe(true);
    expect(enJunio.enVentana).toBe(false);
  });

  it('sin ventana definida, considera enVentana', () => {
    const p = proyectarFloracion(especieBase, historico80, pronostico25, new Date('2026-12-15'));
    expect(p.enVentana).toBe(true);
  });
});

describe('gddHistoricoAcumulado (ERA5)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('consulta el archivo ERA5 desde el 1-jul y acumula GDD', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        daily: {
          time: ['2026-07-01', '2026-07-02'],
          temperature_2m_max: [12, 14],
          temperature_2m_min: [4, 6],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await gddHistoricoAcumulado(-41.86, -73.82, new Date('2026-08-03T12:00:00Z'), 5);

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('archive-api.open-meteo.com/v1/era5');
    expect(url).toContain('start_date=2026-07-01');
    expect(url).toContain('end_date=2026-08-03');
    // día 1: (12+4)/2-5 = 3 · día 2: (14+6)/2-5 = 5 → 8
    expect(res?.acumulado).toBe(8);
    expect(res?.serie).toHaveLength(2);
    expect(res?.serie[1]?.acumulado).toBe(8);
  });

  it('retorna null si la API falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const res = await gddHistoricoAcumulado(-41.86, -73.82, new Date('2026-08-03T12:00:00Z'), 5);
    expect(res).toBeNull();
  });
});
