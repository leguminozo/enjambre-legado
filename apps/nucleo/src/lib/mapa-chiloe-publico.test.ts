import { describe, expect, it } from 'vitest';
import {
  bandNColmenas,
  buildMapaChiloePublico,
  publicCoords,
} from './mapa-chiloe-publico';

describe('bandNColmenas', () => {
  it('bandas', () => {
    expect(bandNColmenas(3)).toBe('1-5');
    expect(bandNColmenas(12)).toBe('6-20');
    expect(bandNColmenas(40)).toBe('21-50');
    expect(bandNColmenas(80)).toBe('50+');
    expect(bandNColmenas(null)).toBe('s/d');
  });
});

describe('publicCoords', () => {
  it('redondea y descarta (0,0)', () => {
    expect(publicCoords(-42.48123, -73.72456)).toEqual({ lat: -42.48, lng: -73.72 });
    expect(publicCoords(0, 0)).toBeNull();
    expect(publicCoords(null, -73)).toBeNull();
  });
});

describe('buildMapaChiloePublico', () => {
  it('anonimiza y no incluye nombres', () => {
    const m = buildMapaChiloePublico({
      apiariosExternos: [
        {
          id: 'a1',
          n_colmenas: 12,
          comuna_destino: 'Queilén',
          comuna_origen: 'Osorno',
          zona_destino: 'Pureo',
          lat_aproximada: -42.481,
          lng_aproximada: -73.721,
          estado: 'activo',
        },
      ],
      predios: [
        {
          id: 'p1',
          comuna: 'Queilén',
          zona: 'Costera',
          lat_aproximada: -42.49,
          lng_aproximada: -73.75,
          activo: true,
        },
      ],
      alertas: [
        {
          id: 'al1',
          comuna: 'Queilén',
          zona: 'Ruta 5',
          lat_aproximada: -42.5,
          lng_aproximada: -73.8,
          radio_km: 3,
          tipo_producto: 'insecticida',
          fecha_programada: '2026-08-10T12:00:00Z',
          estado: 'activa',
        },
      ],
      actores: [{ comuna: 'Queilén', estado: 'activo' }],
      now: new Date('2026-08-05T12:00:00Z'),
    });

    expect(m.apiarios).toHaveLength(2);
    expect(m.apiarios[0]?.colmenas_banda).toBe('6-20');
    expect(m.alertas).toHaveLength(1);
    expect(m.alertas[0]?.tipo_producto).toBe('insecticida');
    // Sin campos de identidad en los puntos
    for (const a of m.apiarios) {
      expect(a).not.toHaveProperty('nombre_actor');
      expect(a).not.toHaveProperty('rup');
      expect(a).not.toHaveProperty('user_id');
    }
    for (const al of m.alertas) {
      expect(al).not.toHaveProperty('producto');
      expect(al).not.toHaveProperty('actor_id');
    }
    expect(m.comunas.find((c) => c.comuna === 'Queilén')?.actores_activos).toBe(1);
    expect(m.privacidad.nivel).toBe('publico_anonimizado');
  });

  it('incluye apiarios del registro local anonimizados con banda de colmenas', () => {
    const m = buildMapaChiloePublico({
      apiariosExternos: [],
      apiariosRegistro: [
        {
          id: 'reg1',
          comuna: 'Ancud',
          zona: 'Chacao',
          lat_aproximada: -41.8312,
          lng_aproximada: -73.5189,
          n_colmenas: 10,
          activo: true,
        },
        {
          id: 'reg2',
          comuna: 'Castro',
          lat_aproximada: null,
          lng_aproximada: null,
          n_colmenas: 5,
          activo: true,
        },
      ],
      predios: [],
      alertas: [],
    });

    expect(m.apiarios).toHaveLength(1);
    expect(m.apiarios[0]?.tipo).toBe('local');
    expect(m.apiarios[0]?.comuna).toBe('Ancud');
    expect(m.apiarios[0]?.colmenas_banda).toBe('6-20');
    expect(m.apiarios[0]?.lat).toBe(-41.83);
    expect(m.apiarios[0]?.lng).toBe(-73.52);
  });

  it('omite puntos sin coords', () => {
    const m = buildMapaChiloePublico({
      apiariosExternos: [{ id: 'x', n_colmenas: 2, comuna_destino: 'Ancud' }],
      predios: [],
      alertas: [],
    });
    expect(m.apiarios).toHaveLength(0);
  });
});
