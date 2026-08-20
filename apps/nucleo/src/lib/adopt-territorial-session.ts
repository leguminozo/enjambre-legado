import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@enjambre/auth';

export type AdoptTerritorialResult = {
  ok: boolean;
  adopted?: boolean;
  code?: string;
};

/** Adopta rol territorial + refresca sesión. Idempotente. */
export async function adoptTerritorialSession(): Promise<AdoptTerritorialResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: 'no_session' };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { ok: false, code: 'no_token' };

  const res = await fetch('/api/auth-territorial/adoptar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) return { ok: false, code: 'adopt_failed' };

  await supabase.auth.refreshSession();
  await useAuthStore.getState().checkUser();
  const json = (await res.json().catch(() => ({}))) as {
    data?: { adopted?: boolean };
  };
  return { ok: true, adopted: Boolean(json.data?.adopted) };
}
