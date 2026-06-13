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

export const ROLE_REDIRECT_MAP: Record<string, string> = {
  admin: '/ejecutivo',
  creador: '/creador',
  rep_ventas: '/caja',
  cliente: '/catalogo',
  ...Object.fromEntries(Object.keys(LEGACY_ROLE_MAP).map(k => [k, '/ejecutivo'])),
}

export function getRoleRedirectPath(role: string): string {
  return ROLE_REDIRECT_MAP[role] ?? '/perfil'
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
  '/invitaciones': ['admin'],
  '/reglas-comision': ['admin'],
  '/comisiones': ['admin', 'rep_ventas'],
  '/reps': ['admin'],
  '/caja': ['admin', 'rep_ventas'],
  '/leaderboard': ['admin', 'rep_ventas'],
  '/colmenas': ['admin'],
  '/regeneracion': ['admin'],
  '/mapa': ['admin'],
  '/catalogo': ['admin', 'cliente'],
  '/operaciones': ['admin'],
  '/comunidad': ['admin'],
  '/creador': ['admin', 'creador'],
  '/perfil': ['admin', 'creador', 'rep_ventas', 'cliente'],
  '/configuracion': ['admin', 'creador', 'rep_ventas', 'cliente'],
}

function normalizeRole(role: string): string {
  return (LEGACY_ROLE_MAP[role] ?? role) as string
}

export function isRouteAllowed(pathname: string, role: string): boolean {
  if (pathname.startsWith('/api/')) return true

  const normalized = normalizeRole(role)

  const exactMatch = ROUTE_ROLE_GUARDS[pathname]
  if (exactMatch) {
    return exactMatch.includes(normalized as RoleKey) || normalized === 'admin'
  }

  const prefixMatch = Object.keys(ROUTE_ROLE_GUARDS)
    .filter(key => key !== '/')
    .find(key => pathname.startsWith(key))

  if (prefixMatch) {
    const allowed = ROUTE_ROLE_GUARDS[prefixMatch]
    return allowed.includes(normalized as RoleKey) || normalized === 'admin'
  }

  return true
}
