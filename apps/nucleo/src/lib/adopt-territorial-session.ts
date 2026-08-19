import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@enjambre/auth';

/** Adopta rol territorial + refresca sesión. Idempotente. */
export async function adoptTerritorialSession(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return false;

  const res = await fetch('/api/auth-territorial/adoptar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) return false;

  await supabase.auth.refreshSession();
  await useAuthStore.getState().checkUser();
  return true;
}
