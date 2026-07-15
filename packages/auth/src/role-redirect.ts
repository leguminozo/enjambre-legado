export type RoleKey =
  | 'admin'
  | 'creador'
  | 'rep_ventas'
  | 'cliente'

export const LEGACY_ROLE_MAP: Record<string, RoleKey> = {
  gerente: 'admin',
  apicultor: 'admin',
  vendedor: 'admin',
  logistica: 'admin',
  marketing: 'admin',
  tienda_admin: 'admin',
}

function absOrPath(baseEnv: string | undefined, path: string): string {
  const base = baseEnv?.replace(/\/$/, '')
  return base ? `${base}${path}` : path
}

/** Paths relativos dentro de cada app (sin dominio) */
const RELATIVE_ROLE_HOME: Record<string, string> = {
  admin: '/ejecutivo',
  creador: '/perfil/creador',
  rep_ventas: '/pos',
  cliente: '/catalogo',
  ...Object.fromEntries(Object.keys(LEGACY_ROLE_MAP).map((k) => [k, '/ejecutivo'])),
}

/**
 * Mapa usado por defecto (contexto núcleo): roles no-admin salen a tienda/campo
 * con URL absoluta si las env están definidas.
 */
export const ROLE_REDIRECT_MAP: Record<string, string> = {
  admin: '/ejecutivo',
  creador: absOrPath(process.env.NEXT_PUBLIC_URL_TIENDA, '/perfil/creador'),
  rep_ventas: absOrPath(process.env.NEXT_PUBLIC_URL_CAMPO, '/pos'),
  cliente: absOrPath(process.env.NEXT_PUBLIC_URL_TIENDA, '/catalogo'),
  ...Object.fromEntries(Object.keys(LEGACY_ROLE_MAP).map((k) => [k, '/ejecutivo'])),
}

/** En núcleo, la redirección es estricta hacia las otras apps para roles no admin */
export const NUCLEO_ROLE_REDIRECT_MAP: Record<string, string> = {
  ...ROLE_REDIRECT_MAP,
}

/**
 * @param app `tienda` → siempre path relativo (misma origin).
 *            `nucleo` → puede ser URL absoluta a tienda/campo.
 */
export function getRoleRedirectPath(role: string, app: 'nucleo' | 'tienda' = 'nucleo'): string {
  if (app === 'tienda') {
    return RELATIVE_ROLE_HOME[role] ?? '/perfil'
  }
  return NUCLEO_ROLE_REDIRECT_MAP[role] ?? '/perfil'
}

export function isExternalRedirect(path: string): boolean {
  return path.startsWith('http://') || path.startsWith('https://')
}

export const ALL_ADMIN_ROLES: RoleKey[] = ['admin']

export const ROUTE_ROLE_GUARDS: Record<string, RoleKey[]> = {
  '/': ['admin'],
  '/ejecutivo': ['admin'],
  '/costeo': ['admin'],
  '/produccion': ['admin'],
  '/crm': ['admin'],
  '/contable': ['admin'],
  '/sii': ['admin'],
  '/banco': ['admin'],
  '/pagos': ['admin'],
  '/conciliacion': ['admin'],
  '/reportes': ['admin'],
  '/calculos-ia': ['admin'],
  '/vanguardia': ['admin'],
  '/creadores': ['admin'],
  '/operadores-feria': ['admin'],
  '/monitor-feria': ['admin'],
  '/mi-feria': ['admin'],
  '/invitaciones': ['admin'],
  '/reglas-comision': ['admin'],
  '/comisiones': ['admin'],
  '/reps': ['admin'],
  '/caja': ['admin'],
  '/leaderboard': ['admin'],
  '/colmenas': ['admin'],
  '/regeneracion': ['admin'],
  '/mapa': ['admin'],
  '/catalogo': ['admin'],
  '/operaciones': ['admin'],
  '/comunidad': ['admin'],
  '/creador': ['admin'],
  '/perfil': ['admin'],
  '/configuracion': ['admin'],
  '/editor-tienda': ['admin'],
  '/calendario': ['admin'],
  '/pipeline': ['admin'],
}

function normalizeRole(role: string): string {
  return (LEGACY_ROLE_MAP[role] ?? role) as string
}

export function isRouteAllowed(pathname: string, role: string): boolean {
  // API authz is enforced in handlers/BFF — middleware must not block CORS/health preflights.
  if (pathname.startsWith('/api/')) return true

  const normalized = normalizeRole(role)

  // Admin (and legacy→admin) may access any núcleo surface.
  if (normalized === 'admin') return true

  const exactMatch = ROUTE_ROLE_GUARDS[pathname]
  if (exactMatch) {
    return exactMatch.includes(normalized as RoleKey)
  }

  const prefixMatch = Object.keys(ROUTE_ROLE_GUARDS)
    .filter(key => key !== '/')
    .find(key => pathname.startsWith(key))

  if (prefixMatch) {
    const allowed = ROUTE_ROLE_GUARDS[prefixMatch]
    return allowed.includes(normalized as RoleKey)
  }

  // Fail-closed: unlisted dashboard routes are not open to cliente/creador/rep.
  // New pages must register in ROUTE_ROLE_GUARDS or remain admin-only.
  return false
}
