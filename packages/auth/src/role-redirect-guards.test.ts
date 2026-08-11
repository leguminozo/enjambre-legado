import { describe, expect, it } from 'vitest';
import {
  isRouteAllowed,
  ROUTE_ROLE_GUARDS,
  LEGACY_ROLE_MAP,
  getRoleRedirectPath,
  type RoleKey,
} from './role-redirect';

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
    expect(isRouteAllowed('/editor-tienda', 'apicultor')).toBe(false);
    expect(isRouteAllowed('/editor-tienda', 'territorial')).toBe(false);
  });

  it('rutas no listadas son fail-closed para no-admin', () => {
    expect(isRouteAllowed('/ruta-nueva-sin-guard', 'cliente')).toBe(false);
    expect(isRouteAllowed('/ruta-nueva-sin-guard', 'admin')).toBe(true);
    expect(isRouteAllowed('/monitor-feria', 'admin')).toBe(true);
    expect(isRouteAllowed('/ruta-nueva-sin-guard', 'apicultor')).toBe(false);
  });
});

describe('ROUTE_ROLE_GUARDS / nav-home-roles', () => {
  it('/inicio es home de admin, territorial y apicultor (patio)', () => {
    expect(ROUTE_ROLE_GUARDS['/inicio']).toEqual(['admin', 'territorial', 'apicultor']);
    expect(isRouteAllowed('/inicio', 'admin')).toBe(true);
    expect(isRouteAllowed('/inicio', 'territorial')).toBe(true);
    expect(isRouteAllowed('/inicio', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/inicio', 'cliente')).toBe(false);
    expect(isRouteAllowed('/inicio', 'rep_ventas')).toBe(false);
  });

  it('aliases legacy /alma y /ejecutivo siguen en guards (pages redirigen a /inicio)', () => {
    expect(ROUTE_ROLE_GUARDS['/alma']).toEqual(['admin', 'territorial', 'apicultor']);
    expect(ROUTE_ROLE_GUARDS['/ejecutivo']).toEqual(['admin', 'territorial', 'apicultor']);
    expect(isRouteAllowed('/alma', 'admin')).toBe(true);
    expect(isRouteAllowed('/alma', 'territorial')).toBe(true);
    expect(isRouteAllowed('/ejecutivo', 'territorial')).toBe(true);
    expect(isRouteAllowed('/alma', 'cliente')).toBe(false);
  });

  it('legacy gerente entra a /inicio vía normalización a admin', () => {
    expect(isRouteAllowed('/inicio', 'gerente')).toBe(true);
  });
});

describe('RoleKey apicultor — patio (no elevación a admin)', () => {
  it('apicultor no está en LEGACY_ROLE_MAP', () => {
    expect(LEGACY_ROLE_MAP['apicultor']).toBeUndefined();
  });

  it('legacy restantes siguen mapeando a admin', () => {
    expect(LEGACY_ROLE_MAP['gerente']).toBe('admin');
    expect(LEGACY_ROLE_MAP['vendedor']).toBe('admin');
    expect(LEGACY_ROLE_MAP['logistica']).toBe('admin');
    expect(LEGACY_ROLE_MAP['marketing']).toBe('admin');
    expect(LEGACY_ROLE_MAP['tienda_admin']).toBe('admin');
  });

  it('home de patio es /inicio (CTAs; colmenas es herramienta)', () => {
    expect(getRoleRedirectPath('apicultor', 'nucleo')).toBe('/inicio');
    expect(getRoleRedirectPath('apicultor', 'tienda')).toBe('/inicio');
  });

  it('allowlist de rutas de patio', () => {
    expect(ROUTE_ROLE_GUARDS['/colmenas']).toEqual(['admin', 'apicultor']);
    expect(isRouteAllowed('/colmenas', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/colmenas/cuaderno', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/colmenas/apiarios', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/calendario', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/configuracion', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/perfil', 'apicultor')).toBe(true);
  });

  it('apicultor no entra a módulos gerenciales', () => {
    const forbidden = [
      '/contable',
      '/sii',
      '/banco',
      '/crm',
      '/editor-tienda',
      '/monitor-feria',
      '/invitaciones',
      '/produccion',
      '/mapa',
      '/pipeline',
      '/operadores-feria',
    ] as const;
    for (const path of forbidden) {
      expect(isRouteAllowed(path, 'apicultor')).toBe(false);
    }
  });

  it('admin conserva acceso a patio y gerencia', () => {
    expect(isRouteAllowed('/colmenas', 'admin')).toBe(true);
    expect(isRouteAllowed('/editor-tienda', 'admin')).toBe(true);
    expect(isRouteAllowed('/contable', 'admin')).toBe(true);
  });
});

describe('ROUTE_ROLE_GUARDS snapshot — inventario de paths', () => {
  it('cada guard declara al menos un RoleKey válido', () => {
    const valid: RoleKey[] = [
      'admin',
      'apicultor',
      'creador',
      'rep_ventas',
      'cliente',
      'territorial',
    ];
    for (const [path, roles] of Object.entries(ROUTE_ROLE_GUARDS)) {
      expect(roles.length, path).toBeGreaterThan(0);
      for (const r of roles) {
        expect(valid, `${path} → ${r}`).toContain(r);
      }
    }
  });

  it('rutas gerenciales sensibles solo admin', () => {
    const adminOnly = [
      '/editor-tienda',
      '/contable',
      '/sii',
      '/banco',
      '/crm',
      '/monitor-feria',
      '/invitaciones',
      '/pipeline',
    ];
    for (const path of adminOnly) {
      expect(ROUTE_ROLE_GUARDS[path]).toEqual(['admin']);
    }
  });
});
