export type RoleKey =
  | 'admin'
  | 'apicultor'
  | 'colaborador'
  | 'creador'
  | 'operador'
  | 'rep_ventas'
  | 'cliente'
  | 'territorial'
  | 'disenador'

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
  colaborador: '/inicio',
  creador: '/perfil/creador',
  operador: '/inicio',
  rep_ventas: '/pos',
  cliente: '/perfil',
  territorial: '/inicio',
  disenador: '/portal-imprenta',
  ...Object.fromEntries(Object.keys(LEGACY_ROLE_MAP).map((k) => [k, '/inicio'])),
}

/**
 * Blindaje estricto entre entornos:
 * - En Núcleo (Registro Territorial): el flujo de entrada, salida y navegación NUNCA
 *   debe cruzar a Tienda. Cualquier usuario autenticado en Núcleo se mantiene en la
 *   plataforma del territorio (/inicio o su portal respectivo).
 * - En Tienda: los clientes sólo ven la tienda y sus perfiles (/perfil, /catalogo),
 *   sin saltar a Núcleo.
 */
export const NUCLEO_ROLE_REDIRECT_MAP: Record<string, string> = {
  admin: '/inicio',
  apicultor: '/inicio',
  colaborador: '/inicio',
  operador: '/inicio',
  territorial: '/inicio',
  disenador: '/portal-imprenta',
  // En Núcleo, clientes o creadores que ingresen adoptan o participan del entorno territorial;
  // bajo ningún concepto se expulsan a la tienda (/catalogo).
  cliente: '/inicio',
  creador: '/inicio',
  rep_ventas: absOrPath(process.env.NEXT_PUBLIC_URL_CAMPO, '/pos'),
  ...Object.fromEntries(Object.keys(LEGACY_ROLE_MAP).map((k) => [k, '/inicio'])),
}

export const ROLE_REDIRECT_MAP: Record<string, string> = {
  ...NUCLEO_ROLE_REDIRECT_MAP,
}

/**
 * @param app `tienda` → siempre path relativo (misma origin de tienda).
 *            `nucleo` → siempre dentro de Núcleo (o Campo si es rep_ventas).
 */
export function getRoleRedirectPath(role: string, app: 'nucleo' | 'tienda' = 'nucleo'): string {
  if (app === 'tienda') {
    return RELATIVE_ROLE_HOME[role] ?? '/perfil'
  }
  return NUCLEO_ROLE_REDIRECT_MAP[role] ?? '/inicio'
}

const NUCLEO_PLATFORM_ROLES: ReadonlySet<string> = new Set([
  'admin',
  'apicultor',
  'operador',
  'territorial',
  'rep_ventas',
  'creador',
  'disenador',
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
  '/inicio': ['admin', 'territorial', 'apicultor', 'operador', 'colaborador'],
  // aliases legacy → pages redirigen a /inicio (mismo home por rol)
  '/ejecutivo': ['admin', 'territorial', 'apicultor', 'operador'],
  '/alma': ['admin', 'territorial', 'apicultor', 'operador'],
  '/costeo': ['admin'],
  '/produccion': ['admin', 'operador', 'colaborador'],
  '/produccion/inventario': ['admin', 'operador', 'colaborador'],
  '/produccion/lotes': ['admin', 'operador', 'colaborador'],
  '/produccion/recoleccion': ['admin', 'operador', 'colaborador'],
  '/despacho': ['admin', 'operador', 'colaborador'],
  '/despacho/envios': ['admin', 'operador', 'colaborador'],
  '/despacho/centros': ['admin', 'operador', 'colaborador'],
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
  '/cuentas': ['admin'],
  '/reglas-comision': ['admin'],
  // Patio & Territorio: colmenas + cuaderno + bitácora (admin ve todo vía RLS is_gerente)
  '/colmenas': ['admin', 'apicultor', 'territorial'],
  '/regeneracion': ['admin'],
  '/mapa': ['admin'],
  '/catalogo': ['admin'],
  '/operaciones': ['admin', 'operador', 'colaborador'],
  '/comunidad': ['admin'],
  '/perfil': ['admin', 'apicultor', 'territorial', 'operador', 'colaborador', 'disenador'],
  '/configuracion': ['admin', 'apicultor', 'territorial', 'operador', 'colaborador', 'disenador'],
  '/portal-imprenta': ['admin', 'disenador'],
  '/produccion/etiquetas': ['admin', 'operador', 'colaborador', 'disenador'],
  '/editor-tienda': ['admin'],
  '/calendario': ['admin', 'apicultor', 'territorial'],
  '/pipeline': ['admin'],
  '/alambique': ['admin'],
  '/fenologia': ['admin', 'territorial', 'apicultor'],
  '/territorio': ['territorial', 'admin', 'apicultor'],
  '/registro-territorial': ['territorial', 'admin', 'apicultor'],
  '/declaracion-sag': ['territorial', 'admin', 'apicultor'],
  '/mis-planes': ['territorial', 'admin', 'apicultor'],
  '/planes-suscripcion': ['admin'],
  '/descuentos': ['admin'],
  '/hidromiel': ['admin'],
  '/microcanales': ['admin'],
  '/analisis': ['admin'],
  '/arco': ['admin'],
  '/reembolsos': ['admin'],
  '/salud': ['admin'],
}

function normalizeRole(role: string): string {
  return (LEGACY_ROLE_MAP[role] ?? role) as string
}

const MODULE_PREFIXES: Record<string, string[]> = {
  inventario: ['/produccion/inventario', '/produccion'],
  lotes: ['/produccion/lotes'],
  recoleccion: ['/produccion/recoleccion'],
  alambique: ['/alambique'],
  infusiones: ['/produccion/infusiones'],
  envios: ['/despacho/envios', '/despacho', '/operaciones'],
  'centros-stock': ['/despacho/centros'],
  proveedores: ['/despacho/proveedores'],
  colmenas: ['/colmenas'],
  'cuaderno-campo': ['/colmenas/cuaderno'],
  'ciclo-bosque': ['/calendario'],
  'monitor-feria': ['/monitor-feria', '/operadores-feria'],
  crm: ['/crm'],
  catalogo: ['/catalogo'],
}

export function isRouteAllowed(
  pathname: string,
  role: string,
  customModules?: readonly string[]
): boolean {
  // API authz is enforced in handlers/BFF — middleware must not block CORS/health preflights.
  if (pathname.startsWith('/api/')) return true

  const normalized = normalizeRole(role)

  // Admin (and legacy→admin) may access any núcleo surface.
  if (normalized === 'admin') return true

  // Soporte dinámico para roles con módulos autorizados
  if (customModules && customModules.length > 0) {
    if (pathname === '/inicio' || pathname === '/perfil' || pathname === '/configuracion') {
      return true
    }
    for (const mod of customModules) {
      const prefixes = MODULE_PREFIXES[mod]
      if (prefixes?.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
        return true
      }
    }
    return false
  }

  const exactMatch = ROUTE_ROLE_GUARDS[pathname]
  if (exactMatch) {
    return exactMatch.includes(normalized as RoleKey)
  }

  const prefixMatch = Object.keys(ROUTE_ROLE_GUARDS)
    .filter((key) => key !== '/')
    .find((key) => pathname.startsWith(key))

  if (prefixMatch) {
    const allowed = ROUTE_ROLE_GUARDS[prefixMatch]
    return allowed.includes(normalized as RoleKey)
  }

  // Fail-closed: unlisted dashboard routes are not open to cliente/creador/rep.
  // New pages must register in ROUTE_ROLE_GUARDS or remain admin-only.
  return false
}
