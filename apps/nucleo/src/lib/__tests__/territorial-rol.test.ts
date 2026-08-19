import { describe, expect, it } from 'vitest';
import {
  getTerritorialHomeTools,
  getTerritorialVisibleKeys,
  resolveTerritorialMenuFamily,
  isTerritorialRol,
} from '../territorial-rol';

describe('territorial-rol · oleada 2a (PR5)', () => {
  it('resuelve familias api vs institucion vs minimo', () => {
    expect(resolveTerritorialMenuFamily('api_residente')).toBe('api');
    expect(resolveTerritorialMenuFamily('api_trashumante')).toBe('api');
    expect(resolveTerritorialMenuFamily('api_mixto')).toBe('api');
    expect(resolveTerritorialMenuFamily('institucion_publica')).toBe('institucion');
    expect(resolveTerritorialMenuFamily('tecnico_inspector')).toBe('minimo');
    expect(resolveTerritorialMenuFamily(null)).toBe('minimo');
    expect(resolveTerritorialMenuFamily(undefined)).toBe('minimo');
  });

  it('api_* y institucion_publica tienen menús distintos', () => {
    const api = getTerritorialVisibleKeys('api_residente');
    const inst = getTerritorialVisibleKeys('institucion_publica');
    expect(api).toContain('mis-planes');
    expect(api).not.toContain('registro-comunal');
    expect(inst).toContain('registro-comunal');
    expect(inst).not.toContain('mis-planes');
    expect(api).not.toEqual(inst);
  });

  it('home tools difieren entre familias', () => {
    const apiTools = getTerritorialHomeTools('api_residente').map((t) => t.href);
    const instTools = getTerritorialHomeTools('institucion_publica').map((t) => t.href);
    expect(apiTools).toContain('/mis-planes');
    expect(apiTools).toContain('/territorio');
    expect(apiTools).toContain('/declaracion-sag');
    expect(instTools[0]).toBe('/registro-territorial');
    expect(instTools).not.toContain('/mis-planes');
  });

  it('isTerritorialRol es fail-closed', () => {
    expect(isTerritorialRol('api_residente')).toBe(true);
    expect(isTerritorialRol('institucion_publica')).toBe(true);
    expect(isTerritorialRol('apicultor')).toBe(false);
    expect(isTerritorialRol('admin')).toBe(false);
  });
});
