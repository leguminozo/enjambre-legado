import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getParticipacionActiva } from './participacion';
import { evaluateRouteAccess, normalizeStorePath } from './store-routes';

/**
 * Guard server-side (defensa en profundidad tras middleware).
 * Usar en páginas con requisito de participación.
 */
export async function assertStoreRouteAccess(pathname: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const participacion = user ? await getParticipacionActiva(supabase, user.id) : undefined;
  const access = evaluateRouteAccess(pathname, {
    isAuthenticated: Boolean(user),
    participacion,
  });

  if (access.allowed) return;

  const normalized = normalizeStorePath(pathname);
  if (access.code === 'auth_required') {
    redirect(`/login?returnTo=${encodeURIComponent(normalized)}`);
  }
  redirect(access.redirectTo);
}