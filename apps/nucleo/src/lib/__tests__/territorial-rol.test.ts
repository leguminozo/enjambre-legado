import { describe, expect, it } from 'vitest';
import {
  CENSO_WRITE_LOCK_CODE,
  TERRITORIAL_ROL_OPTIONS,
  getTerritorialBottomNavKeys,
  getTerritorialCredential,
  getTerritorialHomeTools,
  getTerritorialPrimaryHref,
  getTerritorialTerritoryTabs,
  getTerritorialVisibleKeys,
  isTerritorialRol,
  resolveTerritorialMenuFamily,
  territorialRolLabel,
  resolveTerritorialPlanTier,
  territorialPaidFeatureUnlocked,
  territorialWritesUnlocked,
} from '../territorial-rol';

describe('territorial-rol · tres ejes', () => {
  it('resuelve familias api vs institucion vs minimo', () => {
    expect(resolveTerritorialMenuFamily('api_residente')).toBe('api');
    expect(resolveTerritorialMenuFamily('api_trashumante')).toBe('api');
    expect(resolveTerritorialMenuFamily('api_mixto')).toBe('api');
    expect(resolveTerritorialMenuFamily('institucion_publica')).toBe('institucion');
    expect(resolveTerritorialMenuFamily('tecnico_inspector')).toBe('minimo');
    expect(resolveTerritorialMenuFamily(null)).toBe('minimo');
    expect(resolveTerritorialMenuFamily(undefined)).toBe('minimo');
  });

  it('api_* comparten el mismo set; solo cambia el orden', () => {
    const residente = getTerritorialVisibleKeys('api_residente');
    const trashumante = getTerritorialVisibleKeys('api_trashumante');
    const mixto = getTerritorialVisibleKeys('api_mixto');
    expect([...residente].sort()).toEqual([...trashumante].sort());
    expect([...residente].sort()).toEqual([...mixto].sort());
    expect(residente[1]).toBe('territorio');
    expect(trashumante[1]).toBe('trashumancia');
    expect(mixto[1]).toBe('territorio');
    expect(mixto[2]).toBe('trashumancia');
    expect(residente).not.toEqual(trashumante);
  });

  it('api_* y institucion_publica tienen menús distintos', () => {
    const api = getTerritorialVisibleKeys('api_residente');
    const inst = getTerritorialVisibleKeys('institucion_publica');
    expect(api).toContain('mis-planes');
    expect(api).toContain('mapa-red');
    expect(api).toContain('alertas-red');
    expect(api).toContain('trashumancia');
    expect(api).toContain('declaracion-sag');
    expect(api).not.toContain('registro-comunal');
    expect(inst).toContain('registro-comunal');
    expect(inst).not.toContain('mis-planes');
    expect(api).not.toEqual(inst);
  });

  it('bottom nav enfatiza la actividad, no recorta herramientas', () => {
    expect(getTerritorialBottomNavKeys('api_residente')).toEqual([
      'inicio',
      'territorio',
      'alertas-red',
    ]);
    expect(getTerritorialBottomNavKeys('api_trashumante')).toEqual([
      'inicio',
      'trashumancia',
      'alertas-red',
    ]);
    expect(getTerritorialBottomNavKeys('api_mixto')).toEqual([
      'inicio',
      'territorio',
      'trashumancia',
    ]);
    expect(getTerritorialBottomNavKeys('institucion_publica')).toEqual([
      'inicio',
      'registro-comunal',
    ]);
  });

  it('tabs de territorio reordenan el mismo set por actividad', () => {
    expect(getTerritorialTerritoryTabs('api_residente').map((t) => t.id)).toEqual([
      'registro',
      'alertas',
      'mapa',
      'trashumancia',
    ]);
    expect(getTerritorialTerritoryTabs('api_trashumante').map((t) => t.id)).toEqual([
      'trashumancia',
      'alertas',
      'mapa',
      'registro',
    ]);
    expect(getTerritorialTerritoryTabs('api_mixto').map((t) => t.id)).toEqual([
      'registro',
      'trashumancia',
      'alertas',
      'mapa',
    ]);
  });

  it('home tools: mismo catálogo api, primario según actividad y censo', () => {
    const apiTools = getTerritorialHomeTools('api_residente').map((t) => t.href);
    const instTools = getTerritorialHomeTools('institucion_publica').map((t) => t.href);
    expect(apiTools).toContain('/mis-planes');
    expect(apiTools).toContain('/territorio');
    expect(apiTools).toContain('/declaracion-sag');
    expect(instTools[0]).toBe('/registro-territorial');
    expect(instTools).not.toContain('/mis-planes');

    const trashumante = getTerritorialHomeTools('api_trashumante');
    expect(trashumante[0]).toMatchObject({ href: '/territorio/trashumancia', primary: true });

    const trashumantePendiente = getTerritorialHomeTools('api_trashumante', {
      censoCompleto: false,
    });
    expect(trashumantePendiente[0]).toMatchObject({ href: '/territorio', primary: true });
  });

  it('destino primario: login sigue en /inicio; la herramienta fuerte cambia', () => {
    expect(getTerritorialPrimaryHref('api_residente')).toBe('/territorio');
    expect(getTerritorialPrimaryHref('api_trashumante')).toBe('/territorio/trashumancia');
    expect(getTerritorialPrimaryHref('api_trashumante', { censoCompleto: false })).toBe(
      '/territorio',
    );
    expect(getTerritorialPrimaryHref('institucion_publica')).toBe('/registro-territorial');
  });

  it('eje cumplimiento: solo completo=true desbloquea escrituras', () => {
    expect(territorialWritesUnlocked(true)).toBe(true);
    expect(territorialWritesUnlocked(false)).toBe(false);
    expect(territorialWritesUnlocked(null)).toBe(false);
    expect(territorialWritesUnlocked(undefined)).toBe(false);
    expect(CENSO_WRITE_LOCK_CODE).toBe('censo_incompleto');
  });

  it('eje plan: Red no abre QR ilimitados; Pro incluye Trazabilidad', () => {
    expect(resolveTerritorialPlanTier([])).toBe('red');
    expect(resolveTerritorialPlanTier(['trazabilidad'])).toBe('trazabilidad');
    expect(resolveTerritorialPlanTier(['apiario_pro'])).toBe('apiario_pro');
    expect(territorialPaidFeatureUnlocked('pasaportes_qr_ilimitados', [])).toBe(false);
    expect(territorialPaidFeatureUnlocked('pasaportes_qr_ilimitados', ['trazabilidad'])).toBe(
      true,
    );
    expect(territorialPaidFeatureUnlocked('cuaderno_campo_res_4590', ['trazabilidad'])).toBe(
      false,
    );
    expect(territorialPaidFeatureUnlocked('cuaderno_campo_res_4590', ['apiario_pro'])).toBe(true);
    expect(territorialPaidFeatureUnlocked('pasaportes_qr_ilimitados', ['apiario_pro'])).toBe(true);
  });

  it('credencial es copy, no permiso', () => {
    expect(getTerritorialCredential('referente').label).toBe('Referente');
    expect(getTerritorialCredential('referente').desc.toLowerCase()).toContain('permiso');
    expect(getTerritorialCredential('desconocido').level).toBe('base');
  });

  it('isTerritorialRol es fail-closed', () => {
    expect(isTerritorialRol('api_residente')).toBe(true);
    expect(isTerritorialRol('institucion_publica')).toBe(true);
    expect(isTerritorialRol('apicultor')).toBe(false);
    expect(isTerritorialRol('admin')).toBe(false);
    expect(territorialRolLabel('api_mixto')).toBe('Apicultor/a mixto');
    expect(territorialRolLabel('desconocido')).toBe('desconocido');
  });

  it('oculta comercial_acopio e institucion_publica de las opciones públicas de registro', () => {
    const values = TERRITORIAL_ROL_OPTIONS.map((o) => o.value);
    expect(values).not.toContain('comercial_acopio');
    expect(values).toContain('api_residente');
    expect(values).toContain('api_trashumante');
    expect(values).toContain('api_mixto');
    expect(values).toContain('prop_facilitador');
    expect(values).toContain('agri_fitosanitario');
    expect(values).toContain('agri_aplicador');
    expect(values).toContain('tecnico_inspector');
    expect(values).not.toContain('institucion_publica');
  });
});
