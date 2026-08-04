import { describe, expect, it } from 'vitest';
import { isRouteAllowed, ROUTE_ROLE_GUARDS } from './role-redirect';

describe('ROUTE_ROLE_GUARDS / editor-tienda', () => {
  it('registra /editor-tienda solo admin', () => {
    expect(ROUTE_ROLE_GUARDS['/editor-tienda']).toEqual(['admin']);
  });

  it('admin puede entrar al editor de tienda', () => {
    expect(isRouteAllowed('/editor-tienda', 'admin')).toBe(true);
    expect(isRouteAllowed('/editor-tienda', 'gerente')).toBe(true); // legacy → admin
  });

  it('roles no admin no pueden', () => {
    expect(isRouteAllowed('/editor-tienda', 'cliente')).toBe(false);
    expect(isRouteAllowed('/editor-tienda', 'rep_ventas')).toBe(false);
    expect(isRouteAllowed('/editor-tienda', 'creador')).toBe(false);
  });

  it('rutas no listadas son fail-closed para no-admin', () => {
    expect(isRouteAllowed('/ruta-nueva-sin-guard', 'cliente')).toBe(false);
    expect(isRouteAllowed('/ruta-nueva-sin-guard', 'admin')).toBe(true);
    expect(isRouteAllowed('/monitor-feria', 'admin')).toBe(true);
  });
});

describe('ROUTE_ROLE_GUARDS / nav-home-roles', () => {
  it('/inicio es home de admin y territorial', () => {
    expect(ROUTE_ROLE_GUARDS['/inicio']).toEqual(['admin', 'territorial']);
    expect(isRouteAllowed('/inicio', 'admin')).toBe(true);
    expect(isRouteAllowed('/inicio', 'territorial')).toBe(true);
    expect(isRouteAllowed('/inicio', 'cliente')).toBe(false);
    expect(isRouteAllowed('/inicio', 'rep_ventas')).toBe(false);
  });

  it('aliases legacy /alma y /ejecutivo siguen en guards (pages redirigen a /inicio)', () => {
    expect(ROUTE_ROLE_GUARDS['/alma']).toEqual(['admin', 'territorial']);
    expect(ROUTE_ROLE_GUARDS['/ejecutivo']).toEqual(['admin', 'territorial']);
    expect(isRouteAllowed('/alma', 'admin')).toBe(true);
    expect(isRouteAllowed('/alma', 'territorial')).toBe(true);
    expect(isRouteAllowed('/ejecutivo', 'territorial')).toBe(true);
    expect(isRouteAllowed('/alma', 'cliente')).toBe(false);
  });

  it('legacy gerente entra a /inicio vía normalización a admin', () => {
    expect(isRouteAllowed('/inicio', 'gerente')).toBe(true);
  });
});

