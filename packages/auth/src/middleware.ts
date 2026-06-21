import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseUrl, getSupabaseKey } from './supabase'
import { getInternalApiSecret } from './internal-api-secret'
import {
  isRouteAllowed,
  LEGACY_ROLE_MAP,
  isExternalRedirect,
  NUCLEO_ROLE_REDIRECT_MAP,
} from './role-redirect'

function resolveRedirect(target: string, request: NextRequest): NextResponse {
  if (isExternalRedirect(target)) {
    return NextResponse.redirect(target)
  }
  const url = request.nextUrl.clone()
  url.pathname = target
  return NextResponse.redirect(url)
}

export interface AuthMiddlewareConfig {
  publicRoutes?: string[]
  authRedirect?: string
  roleRedirectMap?: Record<string, string>

  defaultRole?: string
  timeoutMs?: number
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

export function createAuthMiddleware(config: AuthMiddlewareConfig = {}) {
  const {
    publicRoutes = ['/', '/login'],
    authRedirect = '/login',
    roleRedirectMap = NUCLEO_ROLE_REDIRECT_MAP,
    defaultRole = 'cliente',
    timeoutMs = 5000,
  } = config

  return async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseKey()

    const isValidKey = supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_publishable_')
    if (!isValidKey) {
      return supabaseResponse
    }

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
    const { pathname } = request.nextUrl

    if (
      !user &&
      !publicRoutes.some(
        (route) => pathname === route || pathname.startsWith('/api/')
      )
    ) {
      const url = request.nextUrl.clone()
      url.pathname = authRedirect
      return NextResponse.redirect(url)
    }

    if (user && pathname === authRedirect) {
      const rawRole = (user.app_metadata?.role as string) ?? defaultRole
      const role = (LEGACY_ROLE_MAP[rawRole] ?? rawRole) as string
      const redirectPath = roleRedirectMap[role] ?? '/'
      return resolveRedirect(redirectPath, request)
    }

    if (user) {
      const rawRole = (user.app_metadata?.role as string) ?? defaultRole
      const role = (LEGACY_ROLE_MAP[rawRole] ?? rawRole) as string
      if (!isRouteAllowed(pathname, role)) {
        const origin = request.nextUrl.origin
        const internalKey = getInternalApiSecret() || ''
        fetch(`${origin}/api/security-events/internal`, {
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
