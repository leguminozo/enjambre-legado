import { describe, expect, it } from 'vitest';
import type { ParticipacionActiva } from './participacion';
import {
  buildPerfilNavSections,
  evaluateRouteAccess,
  getDeclaredPerfilHrefs,
  isActiveNavHref,
  isAuthEntryPath,
  isPerfilLinkVisible,
  normalizeStorePath,
  requiresAuth,
  requiresParticipacionCheck,
  safeStoreReturnPath,
} from './store-routes';

const baseParticipacion: ParticipacionActiva = {
  esCreador: false,
  creadorEstado: null,
  esAliadoB2B: false,
  aliadoEstado: null,
};

const creadorParticipacion: ParticipacionActiva = {
  esCreador: true,
  creadorEstado: 'activo',
  esAliadoB2B: false,
  aliadoEstado: null,
};

const aliadoParticipacion: ParticipacionActiva = {
  esCreador: false,
  creadorEstado: null,
  esAliadoB2B: true,
  aliadoEstado: 'activo',
};

describe('store-routes — paths', () => {
  it('normaliza prefijos de locale legacy', () => {
    expect(normalizeStorePath('/en/catalogo')).toBe('/catalogo');
    expect(normalizeStorePath('/es/perfil/pedidos')).toBe('/perfil/pedidos');
    expect(normalizeStorePath('/catalogo/')).toBe('/catalogo');
  });

  it('exige auth en /perfil y subrutas', () => {
    expect(requiresAuth('/perfil')).toBe(true);
    expect(requiresAuth('/perfil/creador')).toBe(true);
    expect(requiresAuth('/catalogo')).toBe(false);
    expect(requiresAuth('/login')).toBe(false);
    expect(requiresAuth('/auth/callback')).toBe(false);
  });

  it('detecta rutas de entrada auth', () => {
    expect(isAuthEntryPath('/login')).toBe(true);
    expect(isAuthEntryPath('/register')).toBe(true);
    expect(isAuthEntryPath('/perfil')).toBe(false);
  });

  it('resuelve active nav con subrutas', () => {
    expect(isActiveNavHref('/catalogo', '/catalogo')).toBe(true);
    expect(isActiveNavHref('/perfil/pedidos', '/perfil/pedidos')).toBe(true);
    expect(isActiveNavHref('/perfil/reposicion/resultado', '/perfil/reposicion')).toBe(true);
    expect(isActiveNavHref('/producto/miel', '/catalogo')).toBe(false);
    expect(isActiveNavHref('/', '/')).toBe(true);
  });

  it('bloquea returnTo inseguro', () => {
    expect(safeStoreReturnPath('//evil.com')).toBeNull();
    expect(safeStoreReturnPath('/login')).toBeNull();
    expect(safeStoreReturnPath('/checkout')).toBe('/checkout');
    expect(safeStoreReturnPath('/perfil/pedidos')).toBe('/perfil/pedidos');
    expect(safeStoreReturnPath('/perfil/creador')).toBe('/perfil/creador');
  });
});

describe('store-routes — evaluateRouteAccess', () => {
  it('redirige anónimo en perfil a login', () => {
    const result = evaluateRouteAccess('/perfil', { isAuthenticated: false });
    expect(result).toEqual({ allowed: false, redirectTo: '/login', code: 'auth_required' });
  });

  it('redirige autenticado en login a perfil', () => {
    const result = evaluateRouteAccess('/login', { isAuthenticated: true });
    expect(result).toEqual({ allowed: false, redirectTo: '/perfil', code: 'already_authenticated' });
  });

  it('bloquea /perfil/creador sin fila creador', () => {
    const result = evaluateRouteAccess('/perfil/creador', {
      isAuthenticated: true,
      participacion: baseParticipacion,
    });
    expect(result).toEqual({ allowed: false, redirectTo: '/perfil', code: 'creador_required' });
  });

  it('bloquea /perfil/mayorista sin aliado activo', () => {
    const result = evaluateRouteAccess('/perfil/mayorista', {
      isAuthenticated: true,
      participacion: baseParticipacion,
    });
    expect(result).toEqual({ allowed: false, redirectTo: '/perfil', code: 'aliado_activo_required' });
  });

  it('permite /perfil/mayorista con aliado activo', () => {
    const result = evaluateRouteAccess('/perfil/mayorista', {
      isAuthenticated: true,
      participacion: aliadoParticipacion,
    });
    expect(result).toEqual({ allowed: true });
  });

  it('redirige staff admin en /perfil a Núcleo', () => {
    const result = evaluateRouteAccess('/perfil', {
      isAuthenticated: true,
      isNucleoStaff: true,
      nucleoStaffEntryUrl: 'http://localhost:3000/ejecutivo',
    });
    expect(result).toEqual({
      allowed: false,
      redirectTo: 'http://localhost:3000/ejecutivo',
      code: 'nucleo_staff_redirect',
      external: true,
    });
  });

  it('redirige staff en /login a Núcleo', () => {
    const result = evaluateRouteAccess('/login', {
      isAuthenticated: true,
      isNucleoStaff: true,
      nucleoStaffEntryUrl: 'https://nucleo.test/ejecutivo',
    });
    expect(result).toEqual({
      allowed: false,
      redirectTo: 'https://nucleo.test/ejecutivo',
      code: 'nucleo_staff_redirect',
      external: true,
    });
  });

  it('permite /perfil/creador con esCreador', () => {
    const result = evaluateRouteAccess('/perfil/creador', {
      isAuthenticated: true,
      participacion: creadorParticipacion,
    });
    expect(result).toEqual({ allowed: true });
  });

  it('permite /perfil/creador con estado pendiente (portal gestiona UI)', () => {
    const result = evaluateRouteAccess('/perfil/creador', {
      isAuthenticated: true,
      participacion: { ...creadorParticipacion, creadorEstado: 'pendiente' },
    });
    expect(result).toEqual({ allowed: true });
  });

  it('permite rutas perfil base para cualquier autenticado', () => {
    expect(
      evaluateRouteAccess('/perfil/pedidos', {
        isAuthenticated: true,
        participacion: baseParticipacion,
      }),
    ).toEqual({ allowed: true });
  });

  it('solo consulta participación en rutas restringidas', () => {
    expect(requiresParticipacionCheck('/perfil/creador')).toBe(true);
    expect(requiresParticipacionCheck('/perfil/creador/extra')).toBe(true);
    expect(requiresParticipacionCheck('/perfil/pedidos')).toBe(false);
    expect(requiresParticipacionCheck('/catalogo')).toBe(false);
  });
});

describe('store-routes — perfil nav', () => {
  it('oculta sección embajador sin creador', () => {
    const sections = buildPerfilNavSections(baseParticipacion);
    expect(sections.some((s) => s.key === 'embajador')).toBe(false);
    expect(sections.flatMap((s) => s.links).some((l) => l.href === '/perfil/creador')).toBe(false);
  });

  it('muestra portal creador cuando esCreador', () => {
    const sections = buildPerfilNavSections(creadorParticipacion);
    const embajador = sections.find((s) => s.key === 'embajador');
    expect(embajador?.links.some((l) => l.href === '/perfil/creador')).toBe(true);
  });

  it('muestra catálogo mayorista solo con aliado activo', () => {
    expect(isPerfilLinkVisible('aliado_activo', baseParticipacion)).toBe(false);
    expect(isPerfilLinkVisible('aliado_activo', { ...aliadoParticipacion, aliadoEstado: 'pendiente' })).toBe(
      false,
    );
    expect(isPerfilLinkVisible('aliado_activo', aliadoParticipacion)).toBe(true);

    const sections = buildPerfilNavSections(aliadoParticipacion);
    expect(sections.find((s) => s.key === 'aliado')?.links[0]?.href).toBe('/perfil/mayorista');
  });

  it('declara todas las rutas /perfil del contrato', () => {
    const hrefs = getDeclaredPerfilHrefs();
    expect(hrefs).toContain('/perfil');
    expect(hrefs).toContain('/perfil/creador');
    expect(hrefs).toContain('/perfil/mayorista');
    expect(hrefs).toContain('/perfil/reposicion');
    expect(hrefs).toContain('/perfil/resenas');
    expect(hrefs).toContain('/perfil/trazabilidad');
    expect(hrefs).toContain('/perfil/guardian');
    expect(hrefs.length).toBeGreaterThanOrEqual(12);
  });
});