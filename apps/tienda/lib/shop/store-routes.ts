/**
 * Contrato canónico de rutas de la tienda.
 * Una sola fuente: nav público, nav perfil, guards de middleware, returnTo y E2E.
 */

import type { ParticipacionActiva } from './participacion';

// ─── Nav público ───────────────────────────────────────────────────────────

export type PublicNavKey =
  | 'home'
  | 'creations'
  | 'experiences'
  | 'gallery'
  | 'science'
  | 'about'
  | 'qrScan'
  | 'contact';

export type BottomNavKey = 'home' | 'store' | 'scan' | 'legacy' | 'bag';

export type StoreNavItem = {
  href: `/${string}` | '/';
  labelKey: PublicNavKey;
};

export type BottomNavItem = {
  href: `/${string}` | '/';
  labelKey: BottomNavKey;
  match: (pathname: string) => boolean;
};

export const PUBLIC_NAV: readonly StoreNavItem[] = [
  { href: '/', labelKey: 'home' },
  { href: '/catalogo', labelKey: 'creations' },
  { href: '/experiencias', labelKey: 'experiences' },
  { href: '/galeria', labelKey: 'gallery' },
  { href: '/ciencia', labelKey: 'science' },
  { href: '/nosotros', labelKey: 'about' },
  { href: '/qr-scan', labelKey: 'qrScan' },
  { href: '/contacto', labelKey: 'contact' },
] as const;

export const PWA_BOTTOM_NAV: readonly BottomNavItem[] = [
  { href: '/', labelKey: 'home', match: (p) => p === '/' },
  {
    href: '/catalogo',
    labelKey: 'store',
    match: (p) => p.startsWith('/catalogo') || p.startsWith('/producto'),
  },
  { href: '/qr-scan', labelKey: 'scan', match: (p) => p.startsWith('/qr-scan') },
  { href: '/perfil', labelKey: 'legacy', match: (p) => p.startsWith('/perfil') },
  {
    href: '/carrito',
    labelKey: 'bag',
    match: (p) => p.startsWith('/carrito') || p.startsWith('/checkout'),
  },
] as const;

// ─── Nav perfil (guardian sidebar) ─────────────────────────────────────────

export type PerfilSectionKey =
  | 'identidad'
  | 'embajador'
  | 'aliado'
  | 'comercio'
  | 'red'
  | 'ajustes';

export type PerfilNavLinkKey =
  | 'legado'
  | 'pasaporte'
  | 'reposicion'
  | 'reservas'
  | 'pedidos'
  | 'resenas'
  | 'circular'
  | 'canje'
  | 'alertas'
  | 'ajustes'
  | 'creadorPortal'
  | 'mayoristaPortal'
  | 'catalogoMayorista'
  | 'direcciones'
  | 'logros'
  | 'trazabilidad'
  | 'guardian';

export type PerfilNavVisibility = 'creador' | 'aliado_activo';

export type PerfilNavLinkDef = {
  href: `/${string}` | '/';
  labelKey: PerfilNavLinkKey;
  sectionKey: PerfilSectionKey;
  visibility?: PerfilNavVisibility;
};

type PerfilNavLinkView = Pick<PerfilNavLinkDef, 'href' | 'labelKey'>;

export type PerfilNavSection = {
  key: PerfilSectionKey;
  titleKey: PerfilSectionKey;
  links: readonly PerfilNavLinkView[];
};

/** Orden editorial de secciones en el sidebar guardián. */
export const PERFIL_SECTION_ORDER: readonly PerfilSectionKey[] = [
  'identidad',
  'embajador',
  'aliado',
  'comercio',
  'red',
  'ajustes',
] as const;

export const PERFIL_NAV: readonly PerfilNavLinkDef[] = [
  { href: '/perfil', labelKey: 'legado', sectionKey: 'identidad' },
  { href: '/perfil/guardian', labelKey: 'guardian', sectionKey: 'identidad' },
  { href: '/perfil/pasaporte', labelKey: 'pasaporte', sectionKey: 'identidad' },
  { href: '/perfil/logros', labelKey: 'logros', sectionKey: 'identidad' },
  { href: '/perfil/trazabilidad', labelKey: 'trazabilidad', sectionKey: 'identidad' },
  { href: '/perfil/creador', labelKey: 'creadorPortal', sectionKey: 'embajador', visibility: 'creador' },
  { href: '/perfil/mayorista', labelKey: 'mayoristaPortal', sectionKey: 'aliado', visibility: 'aliado_activo' },
  { href: '/perfil/reposicion', labelKey: 'reposicion', sectionKey: 'comercio' },
  { href: '/perfil/reservas', labelKey: 'reservas', sectionKey: 'comercio' },
  { href: '/perfil/pedidos', labelKey: 'pedidos', sectionKey: 'comercio' },
  { href: '/perfil/resenas', labelKey: 'resenas', sectionKey: 'comercio' },
  { href: '/perfil/circular', labelKey: 'circular', sectionKey: 'red' },
  { href: '/perfil/canje', labelKey: 'canje', sectionKey: 'red' },
  { href: '/perfil/alertas', labelKey: 'alertas', sectionKey: 'red' },
  { href: '/perfil/direcciones', labelKey: 'direcciones', sectionKey: 'ajustes' },
  { href: '/perfil/ajustes', labelKey: 'ajustes', sectionKey: 'ajustes' },
] as const;

export function isPerfilLinkVisible(
  visibility: PerfilNavVisibility | undefined,
  participacion: ParticipacionActiva,
): boolean {
  if (!visibility) return true;
  if (visibility === 'creador') return participacion.esCreador;
  if (visibility === 'aliado_activo') {
    return participacion.esAliadoB2B && participacion.aliadoEstado === 'activo';
  }
  return true;
}

export function buildPerfilNavSections(participacion: ParticipacionActiva): PerfilNavSection[] {
  const visible = PERFIL_NAV.filter((link) => isPerfilLinkVisible(link.visibility, participacion));
  const bySection = new Map<PerfilSectionKey, PerfilNavLinkView[]>();

  for (const link of visible) {
    const bucket = bySection.get(link.sectionKey) ?? [];
    bucket.push({ href: link.href, labelKey: link.labelKey });
    bySection.set(link.sectionKey, bucket);
  }

  return PERFIL_SECTION_ORDER.flatMap((key) => {
    const links = bySection.get(key);
    if (!links?.length) return [];
    return [{ key, titleKey: key, links }];
  });
}

/** Todos los href de perfil declarados en el contrato (para tests y allowlists). */
export function getDeclaredPerfilHrefs(): string[] {
  return PERFIL_NAV.map((l) => l.href).filter((h) => h.startsWith('/perfil'));
}

// ─── Guards de acceso ────────────────────────────────────────────────────────

/** Rutas de resultado post-pago (checkout carrito vs reposición). */
export const CHECKOUT_RESULTADO_PATH = '/checkout/resultado' as const;
export const REPOSICION_RESULTADO_PATH = '/perfil/reposicion/resultado' as const;
export const REPOSICION_PATH = '/perfil/reposicion' as const;

export const AUTH_REQUIRED_PREFIXES = ['/perfil'] as const;
export const AUTH_ENTRY_PATHS = ['/login', '/register'] as const;
export const AUTH_FLOW_PREFIXES = ['/auth', '/recuperar', '/reset-password'] as const;

export type RouteAccessRequirement = 'creador' | 'aliado_activo';

export type PerfilRouteRule = {
  pathPrefix: `/${string}`;
  requirement: RouteAccessRequirement;
  redirectTo: `/${string}`;
  /** Código estable para logs, tests y métricas */
  code: string;
};

/**
 * Rutas con requisito más allá de auth.
 * Ampliar aquí — no dispersar ifs en páginas.
 */
export const PERFIL_ROUTE_RULES: readonly PerfilRouteRule[] = [
  {
    pathPrefix: '/perfil/creador',
    requirement: 'creador',
    redirectTo: '/perfil',
    code: 'creador_required',
  },
  {
    pathPrefix: '/perfil/mayorista',
    requirement: 'aliado_activo',
    redirectTo: '/perfil',
    code: 'aliado_activo_required',
  },
] as const;

export type RouteAccessContext = {
  isAuthenticated: boolean;
  participacion?: Pick<ParticipacionActiva, 'esCreador' | 'creadorEstado' | 'esAliadoB2B' | 'aliadoEstado'>;
  /** Staff admin/gerente resuelto en middleware — desvío a Núcleo */
  isNucleoStaff?: boolean;
  nucleoStaffEntryUrl?: string | null;
};

export type RouteAccessDenied = {
  allowed: false;
  redirectTo: string;
  code: 'auth_required' | 'already_authenticated' | 'nucleo_staff_redirect' | string;
  external?: boolean;
};

export type RouteAccessResult = { allowed: true } | RouteAccessDenied;

const LOCALE_PREFIX_RE = /^\/(es|en)(?=\/|$)/;

export function normalizeStorePath(pathname: string): string {
  const stripped = pathname.replace(LOCALE_PREFIX_RE, '') || '/';
  return stripped.endsWith('/') && stripped.length > 1 ? stripped.slice(0, -1) : stripped;
}

export function isAuthFlowPath(pathname: string): boolean {
  const p = normalizeStorePath(pathname);
  return AUTH_FLOW_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

export function isAuthEntryPath(pathname: string): boolean {
  const p = normalizeStorePath(pathname);
  return (AUTH_ENTRY_PATHS as readonly string[]).includes(p);
}

export function requiresAuth(pathname: string): boolean {
  const p = normalizeStorePath(pathname);
  if (isAuthFlowPath(p) || isAuthEntryPath(p)) return false;
  return AUTH_REQUIRED_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/** Solo consultar participación en middleware cuando la ruta lo exige. */
export function requiresParticipacionCheck(pathname: string): boolean {
  const p = normalizeStorePath(pathname);
  return PERFIL_ROUTE_RULES.some(
    (rule) => p === rule.pathPrefix || p.startsWith(`${rule.pathPrefix}/`),
  );
}

/** Rutas donde staff Núcleo no debe operar en tienda (perfil + entradas auth). */
export function requiresStaffRoleCheck(pathname: string): boolean {
  const p = normalizeStorePath(pathname);
  return requiresAuth(p) || isAuthEntryPath(p);
}

function matchesPerfilRule(pathname: string, pathPrefix: string): boolean {
  return pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`);
}

function satisfiesRequirement(
  requirement: RouteAccessRequirement,
  participacion: RouteAccessContext['participacion'],
): boolean {
  if (!participacion) return false;
  if (requirement === 'creador') return participacion.esCreador;
  if (requirement === 'aliado_activo') {
    return participacion.esAliadoB2B && participacion.aliadoEstado === 'activo';
  }
  return false;
}

function nucleoStaffRedirect(ctx: RouteAccessContext): RouteAccessDenied | null {
  const entry = ctx.nucleoStaffEntryUrl;
  if (!entry) return null;
  return { allowed: false, redirectTo: entry, code: 'nucleo_staff_redirect', external: true };
}

export function evaluateRouteAccess(pathname: string, ctx: RouteAccessContext): RouteAccessResult {
  const p = normalizeStorePath(pathname);

  if (requiresAuth(p) && !ctx.isAuthenticated) {
    return { allowed: false, redirectTo: '/login', code: 'auth_required' };
  }

  if (ctx.isAuthenticated && isAuthEntryPath(p)) {
    if (ctx.isNucleoStaff) {
      return nucleoStaffRedirect(ctx) ?? { allowed: false, redirectTo: '/perfil', code: 'already_authenticated' };
    }
    return { allowed: false, redirectTo: '/perfil', code: 'already_authenticated' };
  }

  if (ctx.isAuthenticated && requiresAuth(p) && ctx.isNucleoStaff) {
    const staffRedirect = nucleoStaffRedirect(ctx);
    if (staffRedirect) return staffRedirect;
  }

  for (const rule of PERFIL_ROUTE_RULES) {
    if (!matchesPerfilRule(p, rule.pathPrefix)) continue;
    if (!satisfiesRequirement(rule.requirement, ctx.participacion)) {
      return { allowed: false, redirectTo: rule.redirectTo, code: rule.code };
    }
  }

  return { allowed: true };
}

export function isActiveNavHref(pathname: string, href: string): boolean {
  const p = normalizeStorePath(pathname);
  if (href === '/') return p === '/';
  return p === href || p.startsWith(`${href}/`);
}

export function safeStoreReturnPath(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const path = raw.trim();
  if (!path.startsWith('/') || path.startsWith('//')) return null;

  const normalized = normalizeStorePath(path);
  if (isAuthEntryPath(normalized) || isAuthFlowPath(normalized)) return null;

  return normalized;
}