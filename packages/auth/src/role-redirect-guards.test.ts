import { describe, expect, it } from 'vitest';
import {
  isRouteAllowed,
  ROUTE_ROLE_GUARDS,
  LEGACY_ROLE_MAP,
  getRoleRedirectPath,
  hasTerritorialSignupIntent,
  resolvePlatformRole,
  type RoleKey,
} from './role-redirect';

describe('resolvePlatformRole — no expulsar territorial al catálogo', () => {
  it('reconoce el alta de la portada aunque el perfil diga cliente', () => {
    expect(
      resolvePlatformRole({
        profileRole: 'cliente',
        jwtRole: 'cliente',
        userMetadata: { app_source: 'nucleo_territorial', territorial_rol: 'api_residente' },
      }),
    ).toBe('territorial');
    expect(hasTerritorialSignupIntent({ territorial_rol: 'api_residente' })).toBe(true);
  });

  it('no pisa admin ni patio ni rep', () => {
    expect(
      resolvePlatformRole({
        profileRole: 'admin',
        userMetadata: { app_source: 'nucleo_territorial' },
      }),
    ).toBe('admin');
    expect(
      resolvePlatformRole({
        profileRole: 'apicultor',
        userMetadata: { territorial_rol: 'api_residente' },
      }),
    ).toBe('apicultor');
  });

  it('cliente de tienda sin metadata territorial sigue cliente', () => {
    expect(
      resolvePlatformRole({
        profileRole: 'cliente',
        jwtRole: 'cliente',
        userMetadata: { app_source: 'tienda' },
      }),
    ).toBe('cliente');
  });
});

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
  it('/inicio es home de admin, territorial, apicultor (patio), operador y colaborador', () => {
    expect(ROUTE_ROLE_GUARDS['/inicio']).toEqual(['admin', 'territorial', 'apicultor', 'operador', 'colaborador']);
    expect(isRouteAllowed('/inicio', 'admin')).toBe(true);
    expect(isRouteAllowed('/inicio', 'territorial')).toBe(true);
    expect(isRouteAllowed('/inicio', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/inicio', 'operador')).toBe(true);
    expect(isRouteAllowed('/inicio', 'colaborador')).toBe(true);
    expect(isRouteAllowed('/inicio', 'cliente')).toBe(false);
    expect(isRouteAllowed('/inicio', 'rep_ventas')).toBe(false);
  });

  it('aliases legacy /alma y /ejecutivo siguen en guards (pages redirigen a /inicio)', () => {
    expect(ROUTE_ROLE_GUARDS['/alma']).toEqual(['admin', 'territorial', 'apicultor', 'operador']);
    expect(ROUTE_ROLE_GUARDS['/ejecutivo']).toEqual(['admin', 'territorial', 'apicultor', 'operador']);
    expect(isRouteAllowed('/alma', 'admin')).toBe(true);
    expect(isRouteAllowed('/alma', 'territorial')).toBe(true);
    expect(isRouteAllowed('/ejecutivo', 'territorial')).toBe(true);
    expect(isRouteAllowed('/alma', 'operador')).toBe(true);
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

  it('allowlist de rutas de patio y territorial', () => {
    expect(ROUTE_ROLE_GUARDS['/colmenas']).toEqual(['admin', 'apicultor', 'territorial']);
    expect(isRouteAllowed('/colmenas', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/colmenas', 'territorial')).toBe(true);
    expect(isRouteAllowed('/colmenas/cuaderno', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/colmenas/cuaderno', 'territorial')).toBe(true);
    expect(isRouteAllowed('/colmenas/apiarios', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/colmenas/apiarios', 'territorial')).toBe(true);
    expect(isRouteAllowed('/calendario', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/calendario', 'territorial')).toBe(true);
    expect(isRouteAllowed('/fenologia', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/fenologia', 'territorial')).toBe(true);
    expect(isRouteAllowed('/configuracion', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/configuracion', 'territorial')).toBe(true);
    expect(isRouteAllowed('/mapa', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/mapa', 'territorial')).toBe(true);
    expect(isRouteAllowed('/perfil', 'apicultor')).toBe(true);
    expect(isRouteAllowed('/perfil', 'territorial')).toBe(true);
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

describe('ROUTE_ROLE_GUARDS / operador (bodega e inventario)', () => {
  it('operador puede entrar a inicio, inventario, lotes y despacho', () => {
    expect(isRouteAllowed('/inicio', 'operador')).toBe(true);
    expect(isRouteAllowed('/produccion', 'operador')).toBe(true);
    expect(isRouteAllowed('/produccion/inventario', 'operador')).toBe(true);
    expect(isRouteAllowed('/produccion/lotes', 'operador')).toBe(true);
    expect(isRouteAllowed('/despacho/centros', 'operador')).toBe(true);
  });

  it('operador es bloqueado en finanzas, SII, banco, CRM y editor de tienda', () => {
    expect(isRouteAllowed('/contable', 'operador')).toBe(false);
    expect(isRouteAllowed('/sii', 'operador')).toBe(false);
    expect(isRouteAllowed('/banco', 'operador')).toBe(false);
    expect(isRouteAllowed('/crm', 'operador')).toBe(false);
    expect(isRouteAllowed('/editor-tienda', 'operador')).toBe(false);
    expect(isRouteAllowed('/invitaciones', 'operador')).toBe(false);
  });
});

describe('ROUTE_ROLE_GUARDS snapshot — inventario de paths', () => {
  it('cada guard declara al menos un RoleKey válido', () => {
    const valid: RoleKey[] = [
      'admin',
      'apicultor',
      'colaborador',
      'creador',
      'operador',
      'rep_ventas',
      'cliente',
      'territorial',
      'disenador',
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
      '/planes-suscripcion',
    ];
    for (const path of adminOnly) {
      expect(ROUTE_ROLE_GUARDS[path]).toEqual(['admin']);
    }
  });
});

describe('isRouteAllowed / dynamic customModules (roles personalizados)', () => {
  it('permite rutas según customModules autorizados para el rol', () => {
    const modules = ['inventario', 'lotes'];
    expect(isRouteAllowed('/produccion/inventario', 'colaborador', modules)).toBe(true);
    expect(isRouteAllowed('/produccion/lotes', 'colaborador', modules)).toBe(true);
    expect(isRouteAllowed('/inicio', 'colaborador', modules)).toBe(true);
    expect(isRouteAllowed('/perfil', 'colaborador', modules)).toBe(true);
    // Rutas no autorizadas en ese rol
    expect(isRouteAllowed('/despacho/envios', 'colaborador', modules)).toBe(false);
    expect(isRouteAllowed('/colmenas', 'colaborador', modules)).toBe(false);
    expect(isRouteAllowed('/contable', 'colaborador', modules)).toBe(false);
    expect(isRouteAllowed('/banco', 'colaborador', modules)).toBe(false);
  });
});

describe('RoleKey disenador — portal imprenta & etiquetas', () => {
  it('redirige a /portal-imprenta por defecto', () => {
    expect(getRoleRedirectPath('disenador', 'nucleo')).toBe('/portal-imprenta');
    expect(getRoleRedirectPath('disenador', 'tienda')).toBe('/portal-imprenta');
  });

  it('permite a disenador y admin acceder a /portal-imprenta y /produccion/etiquetas', () => {
    expect(isRouteAllowed('/portal-imprenta', 'disenador')).toBe(true);
    expect(isRouteAllowed('/portal-imprenta', 'admin')).toBe(true);
    expect(isRouteAllowed('/produccion/etiquetas', 'disenador')).toBe(true);
    expect(isRouteAllowed('/produccion/etiquetas', 'admin')).toBe(true);
  });

  it('bloquea a clientes, rep de ventas y roles no autorizados', () => {
    expect(isRouteAllowed('/portal-imprenta', 'cliente')).toBe(false);
    expect(isRouteAllowed('/portal-imprenta', 'rep_ventas')).toBe(false);
  });
});

