import type { SupabaseClient } from '@supabase/supabase-js';

type JwtUser = {
  id: string;
  app_metadata?: Record<string, unknown>;
};

/** Rol operativo desde JWT; consulta `profiles` solo si hace falta. */
export async function resolveProfileRole(
  supabase: SupabaseClient,
  user: JwtUser,
  options?: { forceDb?: boolean },
): Promise<string> {
  const fromJwt = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : null;
  if (fromJwt && !options?.forceDb) return fromJwt;

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return data?.role ?? fromJwt ?? 'cliente';
}