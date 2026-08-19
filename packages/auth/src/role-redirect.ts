export type RoleKey =
  | 'admin'
  | 'apicultor'
  | 'creador'
  | 'rep_ventas'
  | 'cliente'
  | 'territorial'

/**
 * Roles históricos que se elevan a admin (JWT / filas residuales).
 * `apicultor` NO está aquí: es RoleKey de patio (allowlist), no elevación.
 * Ver docs/ROLES_Y_ACCESO.md.
 */
export const LEGACY_ROLE_MAP: Record<string, RoleKey> = {
  gerente: 'admin',
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
  admin: '/inicio',
  apicultor: '/inicio',
  creador: '/perfil/creador',
  rep_ventas: '/pos',
  cliente: '/catalogo',
  territorial: '/inicio',
  ...Object.fromEntries(Object.keys(LEGACY_ROLE_MAP).map((k) => [k, '/inicio'])),
}

/**
 * Mapa usado por defecto (contexto núcleo): roles no-admin salen a tienda/campo
 * con URL absoluta si las env están definidas.
 */
export const ROLE_REDIRECT_MAP: Record<string, string> = {
  admin: '/inicio',
  apicultor: '/inicio',
  creador: absOrPath(process.env.NEXT_PUBLIC_URL_TIENDA, '/perfil/creador'),
  rep_ventas: absOrPath(process.env.NEXT_PUBLIC_URL_CAMPO, '/pos'),
  cliente: absOrPath(process.env.NEXT_PUBLIC_URL_TIENDA, '/catalogo'),
  territorial: '/inicio',
  ...Object.fromEntries(Object.keys(LEGACY_ROLE_MAP).map((k) => [k, '/inicio'])),
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

const NUCLEO_PLATFORM_ROLES: ReadonlySet<string> = new Set([
  'admin',
  'apicultor',
  'territorial',
  'rep_ventas',
  'creador',
])

/**
 * Alta del Registro Territorial (signup de la portada de Núcleo).
 * Vive en user_metadata; el cliente no puede forjar app_metadata.role.
 */
export function hasTerritorialSignupIntent(
  userMetadata: Record<string, unknown> | null | undefined,
): boolean {
  if (!userMetadata) return false
  if (userMetadata.app_source === 'nucleo_territorial') return true
  const rol = userMetadata.territorial_rol
  return typeof rol === 'string' && rol.trim().length > 0
}

/**
 * Rol de plataforma para Núcleo.
 * profiles.role es la SoT; JWT puede ir vacío o viejo (p.ej. cliente de tienda).
 * Si el alta fue territorial y el perfil quedó en cliente, se trata como territorial
 * para no expulsar al catálogo.
 */
export function resolvePlatformRole(input: {
  profileRole?: string | null
  jwtRole?: string | null
  userMetadata?: Record<string, unknown> | null
}): string {
  const profile =
    typeof input.profileRole === 'string' && input.profileRole.trim()
      ? input.profileRole.trim()
      : ''
  const jwt =
    typeof input.jwtRole === 'string' && input.jwtRole.trim() ? input.jwtRole.trim() : ''
  const raw = profile || jwt || 'cliente'
  const normalized = (LEGACY_ROLE_MAP[raw] ?? raw) as string

  if (NUCLEO_PLATFORM_ROLES.has(normalized)) return normalized

  if (hasTerritorialSignupIntent(input.userMetadata)) return 'territorial'

  return normalized || 'cliente'
}

export function isExternalRedirect(path: string): boolean {
  return path.startsWith('http://') || path.startsWith('https://')
}

export const ALL_ADMIN_ROLES: RoleKey[] = ['admin']

/** Roles con shell de patio en Núcleo (módulos prestados, no panel gerencial). */
export const APICULTOR_SHELL_ROLES: RoleKey[] = ['apicultor']

export const ROUTE_ROLE_GUARDS: Record<string, RoleKey[]> = {
  '/': ['admin'],
  '/inicio': ['admin', 'territorial', 'apicultor'],
  // aliases legacy → pages redirigen a /inicio (mismo home por rol)
  '/ejecutivo': ['admin', 'territorial', 'apicultor'],
  '/alma': ['admin', 'territorial', 'apicultor'],
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
  '/invitaciones': ['admin'],
  '/reglas-comision': ['admin'],
  // Patio: colmenas + cuaderno + bitácora (admin ve todo vía RLS is_gerente)
  '/colmenas': ['admin', 'apicultor'],
  '/regeneracion': ['admin'],
  '/mapa': ['admin'],
  '/catalogo': ['admin'],
  '/operaciones': ['admin'],
  '/comunidad': ['admin'],
  '/perfil': ['admin', 'apicultor', 'territorial'],
  '/configuracion': ['admin', 'apicultor', 'territorial'],
  '/editor-tienda': ['admin'],
  '/calendario': ['admin', 'apicultor'],
  '/pipeline': ['admin'],
  '/alambique': ['admin'],
  '/fenologia': ['admin', 'territorial'],
  '/territorio': ['territorial'],
  '/registro-territorial': ['territorial', 'admin'],
  '/declaracion-sag': ['territorial', 'admin'],
  '/mis-planes': ['territorial', 'admin'],
  // /vanguardia es un redirect vivo → /crm?tab=aliados (B2B)
  // /mi-feria, /comisiones, /reps, /caja, /leaderboard, /creador viven en campo/tienda
  // (no tienen página en nucleo) y se rigen por fail-closed si alguien las pide aquí.
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
