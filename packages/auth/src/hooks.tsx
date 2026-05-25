import { useEffect } from 'react'
import { useAuthStore } from './auth-store'

export function useRoleBasedRedirect(expectedRole?: string, redirectUrl: string = '/login') {
  const { user, isLoading, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      if (window.location.pathname !== redirectUrl) {
        window.location.href = redirectUrl
      }
    } else if (expectedRole && user?.role !== expectedRole && user?.role !== 'gerente') {
      window.location.href = '/'
    }
  }, [user, isLoading, isAuthenticated, expectedRole, redirectUrl])

  return { user, isLoading, isAuthenticated }
}
