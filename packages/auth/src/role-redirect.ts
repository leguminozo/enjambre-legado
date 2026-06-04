export type RoleKey =
  | 'gerente'
  | 'apicultor'
  | 'vendedor'
  | 'rep_ventas'
  | 'logistica'
  | 'marketing'
  | 'tienda_admin'
  | 'creador'
  | 'cliente'

export const ROLE_REDIRECT_MAP: Record<string, string> = {
  gerente: '/',
  apicultor: '/colmenas',
  vendedor: '/caja',
  rep_ventas: '/caja',
  logistica: '/operaciones',
  marketing: '/comunidad',
  tienda_admin: '/catalogo',
  creador: '/creador',
  cliente: '/catalogo',
}

export function getRoleRedirectPath(role: string): string {
  return ROLE_REDIRECT_MAP[role] ?? '/colmenas'
}

export const ROUTE_ROLE_GUARDS: Record<string, RoleKey[]> = {
  '/': ['gerente'],
  '/contable': ['gerente'],
  '/sii': ['gerente'],
  '/banco': ['gerente'],
  '/pagos': ['gerente'],
  '/conciliacion': ['gerente'],
  '/reportes': ['gerente'],
  '/calculos-ia': ['gerente'],
  '/vanguardia': ['gerente'],
  '/creadores': ['gerente'],
  '/invitaciones': ['gerente'],
  '/reglas-comision': ['gerente'],
  '/comisiones': ['gerente', 'rep_ventas', 'vendedor'],
  '/reps': ['gerente'],
  '/caja': ['gerente', 'rep_ventas', 'vendedor'],
  '/leaderboard': ['gerente', 'rep_ventas', 'vendedor'],
  '/colmenas': ['gerente', 'apicultor'],
  '/regeneracion': ['gerente', 'apicultor'],
  '/mapa': ['gerente', 'apicultor'],
  '/catalogo': ['gerente', 'tienda_admin'],
  '/operaciones': ['gerente', 'logistica'],
  '/comunidad': ['gerente', 'marketing'],
  '/creador': ['gerente', 'creador'],
  '/perfil': ['gerente', 'apicultor', 'vendedor', 'rep_ventas', 'logistica', 'marketing', 'tienda_admin', 'creador', 'cliente'],
  '/configuracion': ['gerente', 'apicultor', 'vendedor', 'rep_ventas', 'logistica', 'marketing', 'tienda_admin', 'creador', 'cliente'],
}

export function isRouteAllowed(pathname: string, role: string): boolean {
  if (pathname.startsWith('/api/')) return true

  const exactMatch = ROUTE_ROLE_GUARDS[pathname]
  if (exactMatch) {
    return exactMatch.includes(role as RoleKey) || role === 'gerente'
  }

  const prefixMatch = Object.keys(ROUTE_ROLE_GUARDS)
    .filter(key => key !== '/')
    .find(key => pathname.startsWith(key))

  if (prefixMatch) {
    const allowed = ROUTE_ROLE_GUARDS[prefixMatch]
    return allowed.includes(role as RoleKey) || role === 'gerente'
  }

  return true
}
