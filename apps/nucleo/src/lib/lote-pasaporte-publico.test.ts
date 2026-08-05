import { describe, expect, it } from 'vitest';
import {
  buildOrigenPublico,
  isValidUuid,
  resolveZonaPublica,
  roundCoordsApprox,
} from './lote-pasaporte-publico';

describe('roundCoordsApprox', () => {
  it('redondea a ~1 km (2 decimales)', () => {
    const r = roundCoordsApprox(-42.48123, -73.72456);
    expect(r.lat).toBe(-42.48);
    expect(r.lng).toBe(-73.72);
  });
});

describe('isValidUuid', () => {
  it('acepta UUID v4', () => {
    expect(isValidUuid('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true);
  });
  it('rechaza basura', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('')).toBe(false);
  });
});

describe('buildOrigenPublico', () => {
  it('deduplica y promedia coords redondeadas', () => {
    const o = buildOrigenPublico([
      {
        floracion: 'ulmo',
        fecha: '2026-02-10',
        colmena_name: 'Norte',
        apiario_name: 'Pureo',
        lat: -42.481,
        lng: -73.721,
      },
      {
        floracion: 'ulmo',
        fecha: '2026-02-12',
        colmena_name: 'Sur',
        apiario_name: 'Pureo',
        lat: -42.483,
        lng: -73.723,
      },
      {
        floracion: 'tiaca',
        fecha: '2026-02-08',
        colmena_name: 'Norte',
        apiario_name: 'Yerba',
        lat: 0,
        lng: 0,
      },
    ]);
    expect(o.apiarios).toEqual(['Pureo', 'Yerba']);
    expect(o.colmenas).toEqual(['Norte', 'Sur']);
    expect(o.floraciones).toEqual(['tiaca', 'ulmo']);
    expect(o.n_colmenas).toBe(2);
    expect(o.fecha_recoleccion).toBe('2026-02-08');
    expect(o.zona?.precision).toBe('approx_1km');
    // promedio sin (0,0)
    expect(o.zona?.lat).toBeCloseTo(-42.48, 1);
  });

  it('sin cosechas → vacío', () => {
    const o = buildOrigenPublico([]);
    expect(o.n_colmenas).toBe(0);
    expect(o.zona).toBeNull();
  });
});

describe('resolveZonaPublica', () => {
  it('prioriza cosecha sobre actor', () => {
    const origen = buildOrigenPublico([
      { lat: -42.5, lng: -73.8, colmena_name: 'A', apiario_name: 'P' },
    ]);
    const z = resolveZonaPublica(origen, { lat: -41, lng: -72 });
    expect(z.source).toBe('cosecha');
  });

  it('usa actor redondeado si no hay cosecha', () => {
    const z = resolveZonaPublica(buildOrigenPublico([]), { lat: -42.48111, lng: -73.72999 });
    expect(z.source).toBe('actor');
    expect(z.lat).toBe(-42.48);
    expect(z.lng).toBe(-73.73);
  });

  it('fallback Chiloé', () => {
    const z = resolveZonaPublica(buildOrigenPublico([]), null);
    expect(z.source).toBe('fallback');
  });
});
