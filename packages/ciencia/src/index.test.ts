import { describe, expect, it } from 'vitest';
import {
  CLAIMS_CIENCIA,
  DISCLAIMER_LEY_20606,
  claimsTrianguladas,
  getClaim,
} from './index';

describe('catálogo de afirmaciones científicas', () => {
  it('el disclaimer legal está presente', () => {
    expect(DISCLAIMER_LEY_20606).toContain('Ley 20.606');
  });

  it('cada claim tiene id, título, texto y fuente no vacíos', () => {
    for (const c of CLAIMS_CIENCIA) {
      expect(c.id.trim().length).toBeGreaterThan(0);
      expect(c.titulo.trim().length).toBeGreaterThan(0);
      expect(c.texto.trim().length).toBeGreaterThan(0);
      expect(c.fuente.trim().length).toBeGreaterThan(0);
    }
  });

  it('gate de publicación: solo triangulados son exportables', () => {
    const publicables = claimsTrianguladas();
    for (const c of publicables) {
      expect(c.estado).toBe('triangulado');
      expect(c.fuente).not.toContain('Pendiente');
      expect(c.fuente).not.toContain('Retirado');
    }
    // Las categorías de riesgo legal jamás pueden salir al HTML.
    const idsPublicables = new Set(publicables.map((c) => c.id));
    expect(idsPublicables.has('efectos_ansioliticos')).toBe(false);
    expect(idsPublicables.has('control_glucemico_clinico')).toBe(false);
  });

  it('getClaim resuelve por id estable', () => {
    expect(getClaim('h2o2_antimicrobiana')?.estado).toBe('triangulado');
    expect(getClaim('no_existe')).toBeUndefined();
  });
});