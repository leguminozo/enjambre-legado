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
});
