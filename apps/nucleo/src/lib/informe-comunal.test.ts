import { describe, expect, it } from 'vitest';
import {
  agregarResumenComunas,
  informeDeSlug,
  informesChiloe,
  publicarColmenas,
} from './informe-comunal';

describe('agregarResumenComunas', () => {
  it('canoniza nombres y no expone filas crudas', () => {
    const rows = agregarResumenComunas({
      actores: [{ comuna: 'quemchi' }, { comuna: 'Quemchi' }],
      apiarios: [
        { comuna: 'Quemchi', n_colmenas: 10 },
        { comuna: 'Castro', n_colmenas: 4 },
      ],
      trashumantes: [{ comuna_destino: 'Quemchi' }],
      alertas: [{ comuna: 'Castro' }],
    });
    const quemchi = rows.find((r) => r.comuna === 'Quemchi');
    const castro = rows.find((r) => r.comuna === 'Castro');
    expect(quemchi).toMatchObject({
      actores_activos: 2,
      apiarios: 1,
      colmenas: 10,
      trashumantes: 1,
    });
    expect(castro).toMatchObject({ apiarios: 1, alertas_activas: 1, colmenas: 4 });
  });
});

describe('publicarColmenas', () => {
  it('oculta el total si hay 1 o 2 apiarios', () => {
    expect(publicarColmenas(1, 45).colmenas).toBeNull();
    expect(publicarColmenas(2, 80).colmenas_publicables).toBe(false);
    expect(publicarColmenas(3, 80).colmenas).toBe(80);
    expect(publicarColmenas(0, 0).colmenas).toBe(0);
  });
});

describe('informesChiloe', () => {
  it('lista las 10 comunas aunque no haya datos', () => {
    const informes = informesChiloe([]);
    expect(informes).toHaveLength(10);
    expect(informes.every((i) => i.vacio)).toBe(true);
    expect(informes.find((i) => i.slug === 'quemchi')?.colmenas).toBe(0);
  });

  it('informeDeSlug no inventa una comuna de fuera', () => {
    expect(informeDeSlug([], 'santiago')).toBeNull();
    const quemchi = informeDeSlug([], 'quemchi');
    expect(quemchi?.comuna).toBe('Quemchi');
    expect(quemchi?.vacio).toBe(true);
  });
});
