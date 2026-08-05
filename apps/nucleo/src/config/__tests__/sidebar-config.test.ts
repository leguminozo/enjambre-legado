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
  });

  it('mantiene header en módulos sin ViewShell propio', () => {
    expect(routeUsesViewShell('/comisiones')).toBe(false);
    expect(routeUsesViewShell('/reps')).toBe(false);
    expect(routeUsesViewShell('/caja')).toBe(false);
    expect(routeUsesViewShell('/leaderboard')).toBe(false);
    expect(routeUsesViewShell('/creadores')).toBe(false);
  });
});

describe('SIDEBAR_GROUPS — categorías colapsables por proceso', () => {
  const allItems = getAllItems();

  it('expone las categorías del flujo en orden', () => {
    expect(SIDEBAR_GROUPS.map((g) => g.label)).toEqual([
      'VISIÓN',
      'CAMPO',
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
  });

  it('rol territorial ve Inicio + su registro + el Oráculo Fenológico', () => {
    const groups = getSidebarGroupsForRole('territorial');
    expect(groups.map((g) => g.key)).toEqual(['vision', 'bosque', 'territorio']);
    const byGroup = Object.fromEntries(groups.map((g) => [g.key, g.items.map((i) => i.key)]));
    expect(byGroup['vision']).toEqual(['inicio']);
    expect(byGroup['bosque']).toEqual(['fenologia']);
    expect(byGroup['territorio']).toEqual(['territorio']);
    const territorioItem = groups.find((g) => g.key === 'territorio')!.items[0]!;
    expect(territorioItem.href).toBe('/territorio');
    expect(territorioItem.label).toBe('Mi Territorio');
  });

  it('resolveShellRoleKey nunca eleva a admin sin rol (loading / huésped)', () => {
    expect(resolveShellRoleKey(undefined)).toBe('cliente');
    expect(resolveShellRoleKey(null)).toBe('cliente');
    expect(resolveShellRoleKey('')).toBe('cliente');
    expect(resolveShellRoleKey('gerente')).toBe('admin');
    expect(resolveShellRoleKey('territorial')).toBe('territorial');
  });

  it('cliente/creador/rep no ven menú gerencial (allowlist vacía, no “all”)', () => {
    expect(getSidebarGroupsForRole('cliente')).toEqual([]);
    expect(getSidebarGroupsForRole('creador')).toEqual([]);
    expect(getSidebarGroupsForRole('rep_ventas')).toEqual([]);
    expect(getAccountItemsForRole('cliente')).toEqual([]);
    expect(getSidebarGroupsForRole('admin').length).toBeGreaterThan(3);
  });

  it('bottom nav: admin completo; territorial inicio+territorio; resto mínimo', () => {
    expect(getBottomNavKeysForRole('admin')).toEqual([...BOTTOM_NAV_KEYS]);
    expect(getBottomNavKeysForRole('territorial')).toEqual(['inicio', 'territorio']);
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
    ]);
    expect(prod?.items.find((i) => i.key === 'recoleccion')?.href).toBe('/produccion/recoleccion');
    expect(prod?.items.find((i) => i.key === 'inventario')?.href).toBe('/produccion/inventario');
    expect(prod?.items.find((i) => i.key === 'lotes')?.href).toBe('/produccion/lotes');
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
  });

  it('BOSQUE ordena fenología y plantaciones (mundo vegetal unificado)', () => {
    const bosque = SIDEBAR_GROUPS.find((g) => g.key === 'bosque');
    expect(bosque?.items.map((i) => i.key)).toEqual([
      'fenologia',
      'ciclo-bosque',
      'bosque',
      'alambique',
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
