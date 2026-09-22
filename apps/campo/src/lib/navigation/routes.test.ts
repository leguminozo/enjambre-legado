import { describe, expect, it } from 'vitest';
import { CAMPO_NAV_ROUTES, getCampoNavGroupsForRole } from './routes';
import { CAMPO_PROTECTED_PREFIXES, isCampoProtectedPath } from './paths';

describe('CAMPO_NAV_ROUTES', () => {
  it('incluye POS, feria y caja', () => {
    const hrefs = CAMPO_NAV_ROUTES.map((r) => r.href);
    expect(hrefs).toContain('/pos');
    expect(hrefs).toContain('/mi-feria');
    expect(hrefs).toContain('/caja');
    expect(hrefs).toContain('/comisiones');
    expect(hrefs).toContain('/leaderboard');
  });

  it('cada ruta tiene label e icono', () => {
    for (const r of CAMPO_NAV_ROUTES) {
      expect(r.label.length).toBeGreaterThan(0);
      expect(r.icon).toBeTruthy();
      expect(r.href.startsWith('/')).toBe(true);
    }
  });

  it('nav y prefixes protegidos están alineados', () => {
    expect(CAMPO_NAV_ROUTES.map((r) => r.href)).toEqual([...CAMPO_PROTECTED_PREFIXES]);
  });
});

describe('isCampoProtectedPath', () => {
  it('protege grafo completo del rep, no solo /pos', () => {
    expect(isCampoProtectedPath('/pos')).toBe(true);
    expect(isCampoProtectedPath('/pos/catalogo')).toBe(true);
    expect(isCampoProtectedPath('/caja')).toBe(true);
    expect(isCampoProtectedPath('/mi-feria')).toBe(true);
    expect(isCampoProtectedPath('/comisiones')).toBe(true);
    expect(isCampoProtectedPath('/leaderboard')).toBe(true);
    expect(isCampoProtectedPath('/')).toBe(false);
    expect(isCampoProtectedPath('/login')).toBe(false);
  });
});

describe('getCampoNavGroupsForRole', () => {
  it('otorga idénticas herramientas de terreno a rep_ventas y admin', () => {
    const repGroups = getCampoNavGroupsForRole('rep_ventas');
    const adminGroups = getCampoNavGroupsForRole('admin');
    expect(repGroups).toEqual(adminGroups);
    expect(repGroups.length).toBe(1);
    expect(repGroups[0].routes.length).toBe(6);
  });

  it('retorna vacío para roles no autorizados o nulos', () => {
    expect(getCampoNavGroupsForRole(null)).toEqual([]);
    expect(getCampoNavGroupsForRole(undefined)).toEqual([]);
    expect(getCampoNavGroupsForRole('cliente')).toEqual([]);
  });
});
