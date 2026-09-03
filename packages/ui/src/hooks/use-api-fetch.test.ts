import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  resolveEmpresaId,
  _clearEmpresaIdCacheForTesting,
  type ApiFetchSupabase,
} from './use-api-fetch'

describe('resolveEmpresaId', () => {
  beforeEach(() => {
    _clearEmpresaIdCacheForTesting()
    vi.restoreAllMocks()
  })

  function createMockSupabase(empresaIdResult: string | null = null): ApiFetchSupabase {
    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'test-token',
              user: { id: 'user-123', app_metadata: {} },
            },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: empresaIdResult ? { empresa_id: empresaIdResult } : null,
              }),
            }),
          }),
        }),
      }),
    }
  }

  it('devuelve empresa_id desde app_metadata si existe en JWT y la cachea', async () => {
    const supabase = createMockSupabase('ignore-db')
    const user = { id: 'user-jwt', app_metadata: { empresa_id: 'emp-from-jwt' } }

    const res1 = await resolveEmpresaId(supabase, user)
    expect(res1).toBe('emp-from-jwt')
    // No debe haber consultado DB porque venía en JWT
    expect(supabase.from).not.toHaveBeenCalled()

    // Segunda llamada con user sin claim: debe obtenerlo del caché
    const res2 = await resolveEmpresaId(supabase, { id: 'user-jwt', app_metadata: {} })
    expect(res2).toBe('emp-from-jwt')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('cachea empresaId vacío ("") para usuarios territoriales sin empresa y evita queries redundantes', async () => {
    const supabase = createMockSupabase(null) // null empresa_id en DB
    const user = { id: 'actor-territorial', app_metadata: {} }

    // Primera llamada: consulta usuarios_empresas y cachea ''
    const res1 = await resolveEmpresaId(supabase, user)
    expect(res1).toBe('')
    expect(supabase.from).toHaveBeenCalledTimes(1)

    // Segunda llamada: debe recuperar '' del caché sin volver a consultar Supabase
    const res2 = await resolveEmpresaId(supabase, user)
    expect(res2).toBe('')
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('deduplica peticiones concurrentes para resolver empresaId del mismo usuario', async () => {
    const supabase = createMockSupabase('emp-456')
    const user = { id: 'user-concurrent', app_metadata: {} }

    // Lanzar 3 peticiones en paralelo para el mismo usuario
    const [r1, r2, r3] = await Promise.all([
      resolveEmpresaId(supabase, user),
      resolveEmpresaId(supabase, user),
      resolveEmpresaId(supabase, user),
    ])

    expect(r1).toBe('emp-456')
    expect(r2).toBe('emp-456')
    expect(r3).toBe('emp-456')

    // Solo 1 llamada a la base de datos gracias a la deduplicación in-flight
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })
})
