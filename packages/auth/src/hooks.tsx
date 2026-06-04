import { useEffect } from 'react'
import { useAuthStore } from './auth-store'
import { getRoleRedirectPath } from './role-redirect'

export function useRoleBasedRedirect(expectedRole?: string, redirectUrl: string = '/login') {
  const { user, isLoading, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      if (window.location.pathname !== redirectUrl) {
        window.location.href = redirectUrl
      }
    } else if (expectedRole && user?.role !== expectedRole && user?.role !== 'gerente') {
      const rolePath = getRoleRedirectPath(user?.role ?? '')
      if (window.location.pathname !== rolePath) {
        window.location.href = rolePath
      }
    }
  }, [user, isLoading, isAuthenticated, expectedRole, redirectUrl])

  return { user, isLoading, isAuthenticated }
}
