import { describe, expect, it } from 'vitest';
import {
  CENSO_WRITE_LOCK_CODE,
  TERRITORIAL_ROL_OPTIONS,
  getTerritorialBottomNavKeys,
  getTerritorialCredential,
  getTerritorialHomeCopy,
  getTerritorialHomeTools,
  getTerritorialPrimaryHref,
  getTerritorialTerritoryTabs,
  getTerritorialVisibleKeys,
  isAgriRol,
  isComercialRol,
  isPredioRol,
  isTecnicoRol,
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
    expect(residente).toContain('colmenas');
    expect(residente).toContain('cuaderno-campo');
    expect(residente).toContain('ciclo-bosque');
    expect(trashumante[1]).toBe('trashumancia');
    expect(residente).not.toEqual(trashumante);
  });

  it('api_* y institucion_publica tienen menús distintos', () => {
    const api = getTerritorialVisibleKeys('api_residente');
    const inst = getTerritorialVisibleKeys('institucion_publica');
    expect(api).toContain('colmenas');
    expect(api).toContain('cuaderno-campo');
    expect(api).toContain('ciclo-bosque');
    expect(api).not.toContain('mis-planes');
    expect(api).toContain('mapa-red');
    expect(api).toContain('alertas-red');
    expect(api).toContain('trashumancia');
    expect(api).toContain('declaracion-sag');
    expect(api).not.toContain('registro-comunal');
    expect(inst).toContain('registro-comunal');
    expect(inst).not.toContain('mis-planes');
    expect(inst).not.toContain('colmenas');
    expect(api).not.toEqual(inst);
  });

  it('bottom nav enfatiza la actividad, no recorta herramientas', () => {
    expect(getTerritorialBottomNavKeys('api_residente')).toEqual([
      'inicio',
      'colmenas',
      'territorio',
      'alertas-red',
    ]);
    expect(getTerritorialBottomNavKeys('api_trashumante')).toEqual([
      'inicio',
      'trashumancia',
      'colmenas',
      'alertas-red',
    ]);
    expect(getTerritorialBottomNavKeys('api_mixto')).toEqual([
      'inicio',
      'colmenas',
      'territorio',
      'trashumancia',
    ]);
    expect(getTerritorialBottomNavKeys('institucion_publica')).toEqual([
      'inicio',
      'registro-comunal',
    ]);
  });

  it('oleada 2b: la herramienta primaria de cada subrol es navegable desde el shell', () => {
    const agri = getTerritorialVisibleKeys('agri_fitosanitario');
    expect(agri).toContain('alertas-red');
    expect(getTerritorialVisibleKeys('agri_aplicador')).toContain('alertas-red');

    const predio = getTerritorialVisibleKeys('prop_facilitador');
    expect(predio).toContain('registro-comunal');
    expect(getTerritorialVisibleKeys('tecnico_inspector')).toContain('registro-comunal');

    const comercial = getTerritorialVisibleKeys('comercial_acopio');
    expect(comercial).toContain('mapa-red');
    expect(comercial).toContain('alertas-red');

    expect(getTerritorialBottomNavKeys('agri_fitosanitario')).toEqual([
      'inicio',
      'alertas-red',
      'territorio',
    ]);
    expect(getTerritorialBottomNavKeys('prop_facilitador')).toEqual([
      'inicio',
      'registro-comunal',
      'territorio',
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
    expect(apiTools).not.toContain('/mis-planes');
    expect(apiTools).toContain('/fenologia');
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

  it('detectores de sub-rol (agri/predio/tecnico/comercial) son precisos', () => {
    expect(isAgriRol('agri_fitosanitario')).toBe(true);
    expect(isAgriRol('agri_aplicador')).toBe(true);
    expect(isAgriRol('api_residente')).toBe(false);
    expect(isPredioRol('prop_facilitador')).toBe(true);
    expect(isPredioRol('api_mixto')).toBe(false);
    expect(isTecnicoRol('tecnico_inspector')).toBe(true);
    expect(isTecnicoRol('api_residente')).toBe(false);
    expect(isComercialRol('comercial_acopio')).toBe(true);
    expect(isComercialRol('api_trashumante')).toBe(false);
  });

  it('home tools por sub-rol 2b: cada actor ve sus herramientas propias', () => {
    const agri = getTerritorialHomeTools('agri_fitosanitario');
    expect(agri[0]).toMatchObject({ href: '/territorio/alertas', primary: true });
    expect(agri.map((t) => t.href)).not.toContain('/mis-planes');

    const predio = getTerritorialHomeTools('prop_facilitador');
    expect(predio[0]).toMatchObject({ href: '/registro-territorial', primary: true });

    const tecnico = getTerritorialHomeTools('tecnico_inspector');
    expect(tecnico[0]).toMatchObject({ href: '/registro-territorial', primary: true });

    const comercial = getTerritorialHomeTools('comercial_acopio');
    expect(comercial[0]).toMatchObject({ href: '/territorio', primary: true });
  });

  it('home copy y destino primario por sub-rol 2b', () => {
    expect(getTerritorialHomeCopy('agri_fitosanitario').eyebrow).toContain('agricultura');
    expect(getTerritorialHomeCopy('prop_facilitador').eyebrow).toContain('predios');
    expect(getTerritorialHomeCopy('tecnico_inspector').eyebrow).toContain('sanidad');
    expect(getTerritorialHomeCopy('comercial_acopio').eyebrow).toContain('acopio');

    expect(getTerritorialPrimaryHref('agri_fitosanitario')).toBe('/territorio/alertas');
    expect(getTerritorialPrimaryHref('agri_aplicador')).toBe('/territorio/alertas');
    expect(getTerritorialPrimaryHref('prop_facilitador')).toBe('/registro-territorial');
    expect(getTerritorialPrimaryHref('tecnico_inspector')).toBe('/registro-territorial');
    expect(getTerritorialPrimaryHref('comercial_acopio')).toBe('/territorio');
  });

  it('familias de menú 2b resuelven sin herencia apícola', () => {
    expect(resolveTerritorialMenuFamily('agri_fitosanitario')).toBe('agri');
    expect(resolveTerritorialMenuFamily('agri_aplicador')).toBe('agri');
    expect(resolveTerritorialMenuFamily('prop_facilitador')).toBe('predio');
    expect(resolveTerritorialMenuFamily('comercial_acopio')).toBe('comercial');
    expect(resolveTerritorialMenuFamily('tecnico_inspector')).toBe('minimo');
  });

  it('visible keys por familia: agri/predio/comercial NO ven colmenas ni cuaderno', () => {
    const agri = getTerritorialVisibleKeys('agri_fitosanitario');
    expect(agri).toContain('alertas-red');
    expect(agri).not.toContain('colmenas');
    expect(agri).not.toContain('cuaderno-campo');

    const predio = getTerritorialVisibleKeys('prop_facilitador');
    expect(predio).toContain('registro-comunal');
    expect(predio).not.toContain('colmenas');

    const comercial = getTerritorialVisibleKeys('comercial_acopio');
    expect(comercial).toContain('mapa-red');
    expect(comercial).not.toContain('colmenas');

    const tecnico = getTerritorialVisibleKeys('tecnico_inspector');
    expect(tecnico).toEqual([
      'inicio',
      'territorio',
      'colmenas',
      'cuaderno-campo',
      'registro-comunal',
    ]);
  });

  it('bottom nav por familia 2b: CTA primario en el pulgar', () => {
    expect(getTerritorialBottomNavKeys('agri_fitosanitario')).toEqual([
      'inicio',
      'alertas-red',
      'territorio',
    ]);
    expect(getTerritorialBottomNavKeys('prop_facilitador')).toEqual([
      'inicio',
      'registro-comunal',
      'territorio',
    ]);
    expect(getTerritorialBottomNavKeys('comercial_acopio')).toEqual([
      'inicio',
      'mapa-red',
      'alertas-red',
    ]);
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

  it('opciones públicas de registro: todos los sub-roles salvo institucion_publica', () => {
    const values = TERRITORIAL_ROL_OPTIONS.map((o) => o.value);
    expect(values).toContain('comercial_acopio');
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
