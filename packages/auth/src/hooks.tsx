import { useEffect } from 'react'
import { useAuthStore } from './auth-store'
import { getRoleRedirectPath, LEGACY_ROLE_MAP } from './role-redirect'

function normalizeRole(role: string | undefined): string {
  if (!role) return ''
  return (LEGACY_ROLE_MAP[role] ?? role)
}

export function useRoleBasedRedirect(expectedRole?: string, redirectUrl: string = '/login') {
  const { user, isLoading, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      if (window.location.pathname !== redirectUrl) {
        window.location.href = redirectUrl
      }
    } else if (expectedRole && normalizeRole(user?.role) !== expectedRole && normalizeRole(user?.role) !== 'admin') {
      const rolePath = getRoleRedirectPath(user?.role ?? '')
      if (window.location.pathname !== rolePath) {
        window.location.href = rolePath
      }
    }
  }, [user, isLoading, isAuthenticated, expectedRole, redirectUrl])

  return { user, isLoading, isAuthenticated }
}
