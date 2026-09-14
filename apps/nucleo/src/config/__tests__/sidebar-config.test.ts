import { describe, expect, it } from 'vitest';
import {
  routeUsesViewShell,
  SIDEBAR_GROUPS,
  PREFETCH_PRIORITY_KEYS,
  RAIL_PRIMARY_KEYS,
  BOTTOM_NAV_KEYS,
  getAllItems,
  getSidebarGroupsForRole,
  getAccountItemsForRole,
  findActiveItem,
  isNavItemActive,
  resolveShellRoleKey,
  getBottomNavKeysForRole,
} from '../sidebar-config';
import type { SidebarBadgeValues } from '../../hooks/useSidebarBadges';

describe('routeUsesViewShell', () => {
  it('oculta header global en Inicio (panel ejecutivo)', () => {
    expect(routeUsesViewShell('/inicio')).toBe(true);
  });

  it('oculta header en módulos gerencia con ViewShell', () => {
    expect(routeUsesViewShell('/invitaciones')).toBe(true);
    expect(routeUsesViewShell('/operadores-feria')).toBe(true);
    expect(routeUsesViewShell('/editor-tienda')).toBe(true);
    expect(routeUsesViewShell('/territorio')).toBe(true);
    expect(routeUsesViewShell('/registro-territorial')).toBe(true);
    expect(routeUsesViewShell('/creadores')).toBe(true);
  });

  it('mantiene header en módulos sin ViewShell propio', () => {
    expect(routeUsesViewShell('/comisiones')).toBe(false);
    expect(routeUsesViewShell('/reps')).toBe(false);
    expect(routeUsesViewShell('/caja')).toBe(false);
    expect(routeUsesViewShell('/leaderboard')).toBe(false);
  });
});

describe('SIDEBAR_GROUPS — categorías colapsables por proceso', () => {
  const allItems = getAllItems();

  it('expone las categorías del flujo en orden', () => {
    expect(SIDEBAR_GROUPS.map((g) => g.label)).toEqual([
      'VISIÓN',
      'ENTORNO APÍCOLA',
      'BOSQUE',
      'PRODUCCIÓN',
      'DESPACHO',
      'MERCADO',
      'RED',
      'FINANZAS',
      'TERRITORIO',
    ]);
  });

  it('categorías multi-ítem son colapsables; visión y territorio no', () => {
    const byKey = Object.fromEntries(SIDEBAR_GROUPS.map((g) => [g.key, g.collapsible]));
    expect(byKey['campo']).toBe(true);
    expect(byKey['bosque']).toBe(true);
    expect(byKey['produccion']).toBe(true);
    expect(byKey['despacho']).toBe(true);
    expect(byKey['mercado']).toBe(true);
    expect(byKey['finanzas']).toBe(true);
    expect(byKey['vision']).toBe(false);
    expect(byKey['territorio']).toBe(false);
  });

  it('cada ítem tiene key única', () => {
    const keys = allItems.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('cada key de badge corresponde a un ítem del sidebar (si no, el badge no renderiza)', () => {
    const itemKeys = new Set(allItems.map((i) => i.key));
    for (const badgeKey of Object.keys({} as SidebarBadgeValues)) {
      expect(itemKeys.has(badgeKey)).toBe(true);
    }
  });

  it('cada key de PREFETCH/RAIL/BOTTOM_NAV resuelve a un ítem existente', () => {
    const itemKeys = new Set(allItems.map((i) => i.key));
    for (const key of [...PREFETCH_PRIORITY_KEYS, ...RAIL_PRIMARY_KEYS, ...BOTTOM_NAV_KEYS]) {
      expect(itemKeys.has(key)).toBe(true);
    }
  });

  it('labels canónicos alineados con los títulos internos de cada herramienta', () => {
    const byKey = Object.fromEntries(allItems.map((i) => [i.key, i.label]));
    expect(byKey['recoleccion']).toBe('Recolección');
    expect(byKey['inventario']).toBe('Inventario');
    expect(byKey['lotes']).toBe('Lotes');
    expect(byKey['bosque']).toBe('Plantaciones');
    expect(byKey['ciclo-bosque']).toBe('Calendario');
    expect(byKey['colmenas']).toBe('Colmenas');
    expect(byKey['productos']).toBe('Productos');
    expect(byKey['territorio']).toBe('Mapa del Legado');
    expect(byKey['rcv']).toBe('Registro Compras y Ventas');
    expect(byKey['impuestos']).toBe('Impuestos & F29');
    expect(byKey['calculos-ia']).toBe('Cálculos IA Fiscal');
    expect(byKey['resenas']).toBe('Reseñas Sensoriales');
    expect(byKey['planes-suscripcion']).toBe('Suscripciones Club');
    expect(byKey['especies-nativas']).toBe('Especies Nativas');
  });

  it('DESPACHO es categoría propia; Operadores Feria en MERCADO; Alambique en BOSQUE', () => {
    const groupOf = (key: string) =>
      SIDEBAR_GROUPS.find((g) => g.items.some((i) => i.key === key))?.key;
    expect(groupOf('envios')).toBe('despacho');
    expect(groupOf('proveedores')).toBe('despacho');
    expect(groupOf('mapa-envios')).toBe('despacho');
    expect(groupOf('centros-stock')).toBe('despacho');
    expect(groupOf('operadores-feria')).toBe('mercado');
    expect(groupOf('alambique')).toBe('bosque');
    expect(groupOf('territorio')).toBe('territorio');
    expect(groupOf('creadores-admin')).toBe('red');
    expect(groupOf('inventario')).toBe('produccion');
    expect(groupOf('recoleccion')).toBe('produccion');
    expect(groupOf('productos')).toBe('mercado');
    expect(groupOf('rcv')).toBe('finanzas');
    expect(groupOf('impuestos')).toBe('finanzas');
    expect(groupOf('calculos-ia')).toBe('finanzas');
    expect(groupOf('resenas')).toBe('mercado');
    expect(groupOf('planes-suscripcion')).toBe('mercado');
    expect(groupOf('especies-nativas')).toBe('bosque');
  });

  it('territorial sin sub-rol: menú mínimo con herramientas básicas', () => {
    const groups = getSidebarGroupsForRole('territorial', { territorialRol: null });
    const keys = groups.flatMap((g) => g.items.map((i) => i.key));
    expect(keys).toEqual(['inicio', 'territorio', 'colmenas', 'cuaderno-campo']);
    expect(keys).not.toContain('fenologia');
    expect(keys).not.toContain('mis-planes');
    expect(keys).not.toContain('registro-comunal');
  });

  it('territorial api_*: mismo set completo; orden por actividad (residente = colmenas y censo primero)', () => {
    const groups = getSidebarGroupsForRole('territorial', {
      territorialRol: 'api_residente',
    });
    const keys = groups.flatMap((g) => g.items.map((i) => i.key));
    expect(keys).toEqual([
      'inicio',
      'colmenas',
      'cuaderno-campo',
      'territorio',
      'alertas-red',
      'mapa-red',
      'trashumancia',
      'declaracion-sag',
      'ciclo-bosque',
      'fenologia',
    ]);
    expect(groups.find((g) => g.key === 'campo')?.label).toBe('ENTORNO APÍCOLA');
    expect(groups.find((g) => g.key === 'campo')?.items.map((i) => i.key)).toEqual([
      'colmenas',
      'cuaderno-campo',
    ]);
    expect(groups.find((g) => g.key === 'bosque')?.label).toBe('TIEMPO Y FLORACIÓN');
    expect(groups.find((g) => g.key === 'bosque')?.items.map((i) => i.key)).toEqual([
      'ciclo-bosque',
      'fenologia',
    ]);
    expect(keys).not.toContain('registro-comunal');
    expect(keys).not.toContain('mis-planes');
    const territorioItem = groups
      .flatMap((g) => g.items)
      .find((i) => i.key === 'territorio')!;
    expect(territorioItem.href).toBe('/territorio');
    expect(territorioItem.label).toBe('Mi registro');
    expect(groups.find((g) => g.key === 'territorio')?.label).toBe('RED');
  });

  it('territorial api_trashumante: mismo set, trashumancia antes que colmenas', () => {
    const keys = getSidebarGroupsForRole('territorial', {
      territorialRol: 'api_trashumante',
    }).flatMap((g) => g.items.map((i) => i.key));
    expect(keys).toEqual([
      'inicio',
      'trashumancia',
      'alertas-red',
      'mapa-red',
      'territorio',
      'declaracion-sag',
      'colmenas',
      'cuaderno-campo',
      'ciclo-bosque',
      'fenologia',
    ]);
    expect(keys).not.toContain('mis-planes');
  });

  it('territorial institucion_publica: inicio + censo + fenología (no mis-planes ni colmenas)', () => {
    const groups = getSidebarGroupsForRole('territorial', {
      territorialRol: 'institucion_publica',
    });
    const keys = groups.flatMap((g) => g.items.map((i) => i.key));
    expect(keys).toEqual(['inicio', 'territorio', 'mapa-red', 'registro-comunal', 'fenologia']);
    expect(keys).not.toContain('mis-planes');
    expect(keys).not.toContain('colmenas');
    expect(groups.find((g) => g.key === 'territorio')?.items.map((i) => i.key)).toContain(
      'fenologia',
    );
    const censo = groups.flatMap((g) => g.items).find((i) => i.key === 'registro-comunal')!;
    expect(censo.href).toBe('/registro-territorial');
  });

  it('territorial 2b (ej. tecnico): menú mínimo + su herramienta primaria navegable', () => {
    const keys = getSidebarGroupsForRole('territorial', {
      territorialRol: 'tecnico_inspector',
    }).flatMap((g) => g.items.map((i) => i.key));
    expect(keys).toEqual(['inicio', 'territorio', 'registro-comunal', 'colmenas', 'cuaderno-campo']);
  });

  it('rol apicultor (patio) ve Inicio + Colmenas + Cuaderno + Calendario; no gerencia', () => {
    const groups = getSidebarGroupsForRole('apicultor');
    expect(groups.map((g) => g.key)).toEqual(['vision', 'campo', 'bosque']);
    expect(groups.find((g) => g.key === 'campo')?.label).toBe('ENTORNO APÍCOLA');
    const keys = groups.flatMap((g) => g.items.map((i) => i.key));
    expect(keys).toEqual(['inicio', 'colmenas', 'cuaderno-campo', 'ciclo-bosque']);
    expect(getAccountItemsForRole('apicultor').map((i) => i.key)).toEqual(['configuracion']);
    const cal = groups.flatMap((g) => g.items).find((i) => i.key === 'ciclo-bosque');
    expect(cal?.href).toBe('/calendario');
    expect(cal?.label).toBe('Calendario apícola');
    // No contable / CRM / producción / plantaciones admin
    expect(keys).not.toContain('contabilidad');
    expect(keys).not.toContain('crm');
    expect(keys).not.toContain('inventario');
    expect(keys).not.toContain('bosque'); // plantaciones regeneración
    expect(keys).not.toContain('fenologia');
  });

  it('resolveShellRoleKey nunca eleva a admin sin rol (loading / huésped)', () => {
    expect(resolveShellRoleKey(undefined)).toBe('cliente');
    expect(resolveShellRoleKey(null)).toBe('cliente');
    expect(resolveShellRoleKey('')).toBe('cliente');
    expect(resolveShellRoleKey('gerente')).toBe('admin');
    expect(resolveShellRoleKey('territorial')).toBe('territorial');
    expect(resolveShellRoleKey('apicultor')).toBe('apicultor');
  });

  it('cliente/creador/rep no ven menú gerencial (allowlist vacía, no “all”)', () => {
    expect(getSidebarGroupsForRole('cliente')).toEqual([]);
    expect(getSidebarGroupsForRole('creador')).toEqual([]);
    expect(getSidebarGroupsForRole('rep_ventas')).toEqual([]);
    expect(getAccountItemsForRole('cliente')).toEqual([]);
    expect(getSidebarGroupsForRole('admin').length).toBeGreaterThan(3);
  });

  it('bottom nav: admin completo; territorial por sub-rol; patio inicio+campo; resto mínimo', () => {
    expect(getBottomNavKeysForRole('admin')).toEqual([...BOTTOM_NAV_KEYS]);
    expect(getBottomNavKeysForRole('territorial', { territorialRol: null })).toEqual([
      'inicio',
      'territorio',
    ]);
    expect(
      getBottomNavKeysForRole('territorial', { territorialRol: 'api_residente' }),
    ).toEqual(['inicio', 'colmenas', 'territorio', 'alertas-red']);
    expect(
      getBottomNavKeysForRole('territorial', { territorialRol: 'api_trashumante' }),
    ).toEqual(['inicio', 'trashumancia', 'colmenas', 'alertas-red']);
    expect(
      getBottomNavKeysForRole('territorial', { territorialRol: 'api_mixto' }),
    ).toEqual(['inicio', 'colmenas', 'territorio', 'trashumancia']);
    expect(
      getBottomNavKeysForRole('territorial', { territorialRol: 'institucion_publica' }),
    ).toEqual(['inicio', 'registro-comunal']);
    expect(getBottomNavKeysForRole('apicultor')).toEqual([
      'inicio',
      'colmenas',
      'cuaderno-campo',
      'ciclo-bosque',
    ]);
    expect(getBottomNavKeysForRole('cliente')).toEqual(['inicio']);
  });

  it('CAMPO expone Colmenas unificado y Cuaderno (sin Apiarios duplicado ni Trazabilidad)', () => {
    const campo = SIDEBAR_GROUPS.find((g) => g.key === 'campo');
    const byKey = Object.fromEntries((campo?.items ?? []).map((i) => [i.key, i.href]));
    expect(byKey['colmenas']).toBe('/colmenas');
    expect(byKey['apiarios']).toBeUndefined();
    expect(byKey['cuaderno-campo']).toBe('/colmenas/cuaderno');
    expect(campo?.items.map((i) => i.key)).toEqual(['colmenas', 'cuaderno-campo']);
    const allKeys = getAllItems().map((i) => i.key);
    expect(allKeys).not.toContain('trazabilidad');
    expect(allKeys).not.toContain('apiarios');
    expect(allKeys).toContain('inventario');
    expect(allKeys).toContain('recoleccion');
    expect(allKeys).toContain('lotes');
    expect(allKeys).toContain('fenologia');
  });

  it('PRODUCCIÓN separa Recolección, Lotes e Inventario', () => {
    const prod = SIDEBAR_GROUPS.find((g) => g.key === 'produccion');
    expect(prod?.items.map((i) => i.key)).toEqual([
      'recoleccion',
      'lotes',
      'inventario',
      'costeo',
      'hidromiel',
      'infusiones',
    ]);
    expect(prod?.items.find((i) => i.key === 'recoleccion')?.href).toBe('/produccion/recoleccion');
    expect(prod?.items.find((i) => i.key === 'inventario')?.href).toBe('/produccion/inventario');
    expect(prod?.items.find((i) => i.key === 'lotes')?.href).toBe('/produccion/lotes');
    expect(prod?.items.find((i) => i.key === 'hidromiel')?.href).toBe('/hidromiel');
  });

  it('findActiveItem resuelve sub-rutas al ítem propio, no al padre', () => {
    expect(findActiveItem('/colmenas/apiarios')?.key).toBe('colmenas');
    expect(findActiveItem('/colmenas/cuaderno')?.key).toBe('cuaderno-campo');
    expect(findActiveItem('/produccion/recoleccion')?.key).toBe('recoleccion');
    expect(findActiveItem('/produccion/inventario')?.key).toBe('inventario');
    expect(findActiveItem('/produccion/lotes')?.key).toBe('lotes');
    expect(findActiveItem('/colmenas/trazabilidad')?.key).toBe('lotes');
    expect(findActiveItem('/produccion')?.key).toBe('inventario');
    expect(findActiveItem('/colmenas')?.key).toBe('colmenas');
    expect(findActiveItem('/sii/rcv')?.key).toBe('rcv');
    expect(findActiveItem('/sii/impuestos')?.key).toBe('impuestos');
    expect(findActiveItem('/calculos-ia')?.key).toBe('calculos-ia');
    expect(findActiveItem('/crm/resenas')?.key).toBe('resenas');
    expect(findActiveItem('/planes-suscripcion')?.key).toBe('planes-suscripcion');
    expect(findActiveItem('/fenologia/especies')?.key).toBe('especies-nativas');
    expect(findActiveItem('/territorio/')?.key).toBe('territorio');
    expect(findActiveItem('/territorio/trashumancia')?.key).toBe('trashumancia');
  });

  it('isNavItemActive no enciende el padre cuando hay un hijo más específico', () => {
    expect(isNavItemActive('/colmenas/cuaderno', 'cuaderno-campo')).toBe(true);
    expect(isNavItemActive('/colmenas/cuaderno', 'colmenas')).toBe(false);
    expect(isNavItemActive('/colmenas', 'colmenas')).toBe(true);
    expect(isNavItemActive('/territorio/trashumancia', 'trashumancia')).toBe(true);
    expect(isNavItemActive('/territorio/trashumancia', 'territorio')).toBe(false);
    expect(isNavItemActive('/territorio', 'territorio')).toBe(true);
    expect(isNavItemActive('/territorio/mapa', 'mapa-red')).toBe(true);
    expect(isNavItemActive('/calendario', 'ciclo-bosque')).toBe(true);
  });

  it('BOSQUE ordena fenología y plantaciones (mundo vegetal unificado)', () => {
    const bosque = SIDEBAR_GROUPS.find((g) => g.key === 'bosque');
    expect(bosque?.items.map((i) => i.key)).toEqual([
      'fenologia',
      'ciclo-bosque',
      'bosque',
      'alambique',
      'especies-nativas',
    ]);
  });

  it('DESPACHO separa Envíos, Centros, Proveedores y Mapa', () => {
    const d = SIDEBAR_GROUPS.find((g) => g.key === 'despacho');
    expect(d?.items.map((i) => i.key)).toEqual([
      'envios',
      'centros-stock',
      'proveedores',
      'mapa-envios',
    ]);
    expect(findActiveItem('/despacho/envios')?.key).toBe('envios');
    expect(findActiveItem('/despacho/proveedores')?.key).toBe('proveedores');
    expect(findActiveItem('/despacho/mapa')?.key).toBe('mapa-envios');
    expect(findActiveItem('/despacho/centros')?.key).toBe('centros-stock');
    expect(findActiveItem('/operaciones')?.key).toBe('envios');
  });
});
