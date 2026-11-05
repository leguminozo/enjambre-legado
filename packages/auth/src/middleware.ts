import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseUrl, getSupabaseKey, isSupabaseConfigured } from './supabase'
import { getInternalApiSecret } from './internal-api-secret'
import {
  isRouteAllowed,
  isExternalRedirect,
  NUCLEO_ROLE_REDIRECT_MAP,
  resolvePlatformRole,
} from './role-redirect'

function resolveRedirect(target: string, request: NextRequest): NextResponse {
  if (isExternalRedirect(target)) {
    return NextResponse.redirect(target)
  }
  const url = request.nextUrl.clone()
  url.pathname = target
  return NextResponse.redirect(url)
}

function isPublicPath(pathname: string, publicRoutes: string[], publicPathPrefixes: string[]): boolean {
  if (pathname.startsWith('/api/')) return true
  if (publicRoutes.some((route) => pathname === route)) return true
  // Rutas públicas por prefijo (páginas de trazabilidad con IDs dinámicos, ej. /alambique/xxx)
  return publicPathPrefixes.some((prefix) => pathname.startsWith(prefix))
}

export interface AuthMiddlewareConfig {
  publicRoutes?: string[]
  /** Prefijos de ruta accesibles sin sesión (páginas públicas con IDs dinámicos). */
  publicPathPrefixes?: string[]
  authRedirect?: string
  roleRedirectMap?: Record<string, string>

  /** Least privilege: missing app_metadata.role must never elevate (never default to admin). */
  defaultRole?: string
  timeoutMs?: number
}

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

async function resolveUserRole(
  supabase: ReturnType<typeof createServerClient>,
  user: {
    id: string
    app_metadata?: Record<string, unknown>
    user_metadata?: Record<string, unknown>
  },
  defaultRole: string,
): Promise<string> {
  const fromJwt = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : null
  let fromProfile: string | null
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    fromProfile = typeof data?.role === 'string' ? data.role : null
  } catch {
    fromProfile = null
  }

  const resolved = resolvePlatformRole({
    profileRole: fromProfile,
    jwtRole: fromJwt,
    userMetadata: user.user_metadata,
  })
  return resolved || defaultRole
}

export function createAuthMiddleware(config: AuthMiddlewareConfig = {}) {
  const {
    publicRoutes = ['/', '/login'],
    publicPathPrefixes = [],
    authRedirect = '/login',
    roleRedirectMap = NUCLEO_ROLE_REDIRECT_MAP,
    defaultRole = 'cliente',
    timeoutMs = 5000,
  } = config

  return async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })
    const { pathname } = request.nextUrl

    // Fail-closed: misconfigured Supabase must not open protected surfaces.
    if (!isSupabaseConfigured()) {
      if (isPublicPath(pathname, publicRoutes, publicPathPrefixes)) {
        return supabaseResponse
      }
      const url = request.nextUrl.clone()
      url.pathname = authRedirect
      return NextResponse.redirect(url)
    }

    // Visitante anónimo en ruta pública: sin cookie de sesión no hay nada que validar,
    // así evitamos 2 llamadas a Supabase por cada visita (clave con plan Free).
    if (isPublicPath(pathname, publicRoutes, publicPathPrefixes) && !hasSessionCookie(request)) {
      return supabaseResponse
    }

    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseKey()

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const result = await withTimeout(supabase.auth.getUser(), timeoutMs)
    const user = result?.data?.user ?? null

    if (!user && !isPublicPath(pathname, publicRoutes, publicPathPrefixes)) {
      const url = request.nextUrl.clone()
      url.pathname = authRedirect
      return NextResponse.redirect(url)
    }

    if (user && pathname === authRedirect) {
      const role = await resolveUserRole(supabase, user, defaultRole)
      // Cliente en /login de Núcleo: no expulsar al catálogo. La página
      // adopta el rol territorial (alta de la red) y recién ahí entra a /inicio.
      if (role === 'cliente' && authRedirect === '/login') {
        return supabaseResponse
      }
      const redirectPath = roleRedirectMap[role] ?? '/'
      return resolveRedirect(redirectPath, request)
    }

    if (user) {
      const role = await resolveUserRole(supabase, user, defaultRole)
      if (!isRouteAllowed(pathname, role)) {
        const origin = request.nextUrl.origin
        const internalKey = getInternalApiSecret() || ''
        // Fire-and-forget: el log no debe bloquear el redirect (antes esperaba hasta 100ms)
        void fetch(`${origin}/api/security-events/internal`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(internalKey ? { 'x-internal-key': internalKey } : {}),
          },
          body: JSON.stringify({
            eventType: 'access_denied',
            email: user.email ?? '',
            userId: user.id,
            details: { attemptedPath: pathname, role },
          }),
        }).catch(() => {})
        const targetPath = roleRedirectMap[role] ?? '/perfil'
        if (!isExternalRedirect(targetPath) && pathname === targetPath) {
          return new NextResponse('Access Denied', { status: 403 })
        }
        return resolveRedirect(targetPath, request)
      }
    }

    return supabaseResponse
  }
}
