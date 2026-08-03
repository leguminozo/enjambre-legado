import { describe, expect, it } from 'vitest';
import {
  routeUsesViewShell,
  SIDEBAR_GROUPS,
  PREFETCH_PRIORITY_KEYS,
  RAIL_PRIMARY_KEYS,
  BOTTOM_NAV_KEYS,
  getAllItems,
  getSidebarGroupsForRole,
  findActiveItem,
} from '../sidebar-config';
import type { SidebarBadgeValues } from '../../hooks/useSidebarBadges';

describe('routeUsesViewShell', () => {
  it('oculta header global en Inicio (panel ejecutivo)', () => {
    expect(routeUsesViewShell('/inicio')).toBe(true);
    expect(routeUsesViewShell('/alma')).toBe(true);
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
    // /leaderboard no está en VIEW_SHELL_PATHS (usa header global)
    expect(routeUsesViewShell('/leaderboard')).toBe(false);
    // /creadores usa header global: el panel no renderiza ViewShell propio
    expect(routeUsesViewShell('/creadores')).toBe(false);
  });
});

describe('SIDEBAR_GROUPS — IA fragmentada por proceso', () => {
  const allItems = getAllItems();

  it('expone las categorías del flujo en orden', () => {
    expect(SIDEBAR_GROUPS.map((g) => g.label)).toEqual([
      'VISIÓN',
      'RECOLECCIÓN',
      'BOSQUE',
      'PRODUCCIÓN',
      'MERCADO',
      'RED',
      'FINANZAS',
      'TERRITORIO',
    ]);
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
    expect(byKey['produccion']).toBe('Producción');
    expect(byKey['bosque']).toBe('Bosque');
    expect(byKey['ciclo-bosque']).toBe('Calendario');
    expect(byKey['colmenas']).toBe('Colmenas');
    expect(byKey['territorio']).toBe('Mapa del Legado');
  });

  it('Despacho y Operadores Feria viven en MERCADO; Alambique en BOSQUE; Territorio separado', () => {
    const groupOf = (key: string) =>
      SIDEBAR_GROUPS.find((g) => g.items.some((i) => i.key === key))?.key;
    expect(groupOf('despacho')).toBe('mercado');
    expect(groupOf('operadores-feria')).toBe('mercado');
    expect(groupOf('alambique')).toBe('bosque');
    expect(groupOf('territorio')).toBe('territorio');
    expect(groupOf('creadores-admin')).toBe('red');
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

  it('RECOLECCIÓN expone Colmenas, Apiarios, Cuaderno Campo y Trazabilidad como sub-rutas', () => {
    const recoleccion = SIDEBAR_GROUPS.find((g) => g.key === 'recoleccion');
    const byKey = Object.fromEntries((recoleccion?.items ?? []).map((i) => [i.key, i.href]));
    expect(byKey['colmenas']).toBe('/colmenas');
    expect(byKey['apiarios']).toBe('/colmenas/apiarios');
    expect(byKey['cuaderno-campo']).toBe('/colmenas/cuaderno');
    expect(byKey['trazabilidad']).toBe('/colmenas/trazabilidad');
  });

  it('findActiveItem resuelve sub-rutas al ítem propio, no al padre', () => {
    expect(findActiveItem('/colmenas/apiarios')?.key).toBe('apiarios');
    expect(findActiveItem('/colmenas/cuaderno')?.key).toBe('cuaderno-campo');
    expect(findActiveItem('/colmenas/trazabilidad')?.key).toBe('trazabilidad');
    expect(findActiveItem('/colmenas')?.key).toBe('colmenas');
  });
});
