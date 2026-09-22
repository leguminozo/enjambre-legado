import { describe, it, expect, vi, beforeEach } from 'vitest'

let mockGetUser = vi.fn()

vi.mock('./supabase', () => ({
  createClient: () => ({
    auth: {
      getUser: () => mockGetUser(),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  }),
  getSupabaseUrl: () => 'https://mock.supabase.co',
  getSupabaseKey: () => 'eyJmock-key',
  isSupabaseConfigured: () => true,
}))

describe('auth-store offline resilience', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJmock-key'

    const { SessionVault } = await import('./session-vault')
    SessionVault.clearVault()
  })

  it('identifies network and offline error types correctly', async () => {
    const { isNetworkOrOfflineError } = await import('./auth-store')

    expect(isNetworkOrOfflineError(new TypeError('Failed to fetch'))).toBe(true)
    expect(isNetworkOrOfflineError({ message: 'NetworkError when attempting to fetch resource.' })).toBe(true)
    expect(isNetworkOrOfflineError({ name: 'AuthRetryableFetchError', message: 'retryable' })).toBe(true)
    expect(isNetworkOrOfflineError({ message: 'The user aborted a request.' })).toBe(true)
    expect(isNetworkOrOfflineError({ message: 'Invalid login credentials' })).toBe(false)
    expect(isNetworkOrOfflineError({ status: 401, message: 'Unauthorized' })).toBe(false)
  })

  it('preserves existing user when network fails during checkUser', async () => {
    const { useAuthStore } = await import('./auth-store')

    const existingUser = {
      id: 'offline-rep-1',
      email: 'pos@enjambrelegado.cl',
      role: 'rep_ventas',
      territorial_rol: null,
      nivel_guardian: '',
      full_name: 'Vendedor Feria',
      avatar_url: '',
      theme_preference: 'dark' as const,
    }

    useAuthStore.setState({
      user: existingUser,
      session: null,
      isAuthenticated: true,
      isLoading: false,
    })

    // Mock network failure in getUser
    mockGetUser = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    await useAuthStore.getState().checkUser()

    const state = useAuthStore.getState()
    // Should NOT be logged out!
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.id).toBe('offline-rep-1')
    expect(state.user?.role).toBe('rep_ventas')
    expect(state.isLoading).toBe(false)
  })

  it('logs out cleanly when receiving genuine 401 unauthenticated error', async () => {
    const { useAuthStore } = await import('./auth-store')

    useAuthStore.setState({
      user: {
        id: 'revoked-user',
        email: 'revoked@test.cl',
        role: 'cliente',
        territorial_rol: null,
        nivel_guardian: '',
        full_name: '',
        avatar_url: '',
        theme_preference: 'system',
      },
      isAuthenticated: true,
      isLoading: false,
    })

    mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { status: 401, message: 'JWT expired' },
    })

    await useAuthStore.getState().checkUser()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.isLoading).toBe(false)
  })
})
