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

describe('buildMapaChiloePublico (Defensa Territorial)', () => {
  it('resguarda la privacidad territorial omitiendo coordenadas individuales de apiarios', () => {
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

    // En la API pública no emitimos coordenadas individuales de colmenas
    expect(m.apiarios).toHaveLength(0);
    // Pero sí emitimos las Zonas Comunales consolidadas de Chiloé
    expect(m.zonas_comunales.length).toBeGreaterThanOrEqual(10);
    const queilenZona = m.zonas_comunales.find((z) => z.comuna === 'Queilén');
    expect(queilenZona).toBeDefined();
    expect(queilenZona?.asentamientos_protegidos).toBe(1);
    expect(queilenZona?.actores_activos).toBe(1);
    expect(queilenZona?.alertas_activas).toBe(1);

    // Alertas públicas preventivas
    expect(m.alertas).toHaveLength(1);
    expect(m.alertas[0]?.tipo_producto).toBe('insecticida');

    for (const al of m.alertas) {
      expect(al).not.toHaveProperty('producto');
      expect(al).not.toHaveProperty('actor_id');
    }

    const queilenComuna = m.comunas.find((c) => c.comuna === 'Queilén');
    expect(queilenComuna?.actores_activos).toBe(1);
    expect(queilenComuna?.apiarios_externos).toBe(1);
    expect(m.privacidad.nivel).toBe('publico_anonimizado');
    expect(m.privacidad.modelo_defensa).toBe('agregacion_comunal_k_anonymity');
  });

  it('agrega asentamientos de apiarios_registro a nivel comunal sin exponer coordenadas', () => {
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
          lat_aproximada: -42.48,
          lng_aproximada: -73.77,
          n_colmenas: 5,
          activo: true,
        },
      ],
      predios: [],
      alertas: [],
    });

    // Cero coordenadas de colmenas individuales
    expect(m.apiarios).toHaveLength(0);
    const ancudZona = m.zonas_comunales.find((z) => z.comuna === 'Ancud');
    const castroZona = m.zonas_comunales.find((z) => z.comuna === 'Castro');
    expect(ancudZona?.asentamientos_protegidos).toBe(1);
    expect(castroZona?.asentamientos_protegidos).toBe(1);
  });

  it('normaliza comunas con/sin tilde a exactamente 10 comunas oficiales de Chiloé', () => {
    const m = buildMapaChiloePublico({
      apiariosExternos: [],
      apiariosRegistro: [
        { id: '1', comuna: 'Queilen', activo: true },
        { id: '2', comuna: 'Queilén', activo: true },
        { id: '3', comuna: 'quellon', activo: true },
        { id: '4', comuna: 'puqueldon', activo: true },
      ],
      predios: [],
      alertas: [],
      actores: [
        { comuna: 'Queilen', estado: 'activo' },
        { comuna: 'Queilén', estado: 'activo' },
      ],
    });

    expect(m.comunas).toHaveLength(10);
    const queilen = m.comunas.find((c) => c.comuna === 'Queilén');
    expect(queilen).toBeDefined();
    // Suma las apariciones de "Queilen" y "Queilén" en la misma cuenca
    expect(queilen?.asentamientos_protegidos).toBe(2);
    expect(queilen?.actores_activos).toBe(2);

    // No debe existir "Queilen" duplicado
    const queilenSinTilde = m.comunas.find((c) => c.comuna === 'Queilen');
    expect(queilenSinTilde).toBeUndefined();
  });
});
