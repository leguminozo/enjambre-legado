'use client';

import { useSession } from '@/providers/Providers';
import { useSupabase } from '@/providers/Providers';

export function useApiFetch() {
  const session = useSession();
  const supabase = useSupabase();

  return async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const token = currentSession?.access_token ?? '';
    const empresaId = currentSession?.user?.app_metadata?.empresa_id ?? '';

    const headers = new Headers(init?.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (empresaId) headers.set('x-empresa-id', empresaId);
    if (!headers.has('Content-Type') && init?.body) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(path, { ...init, headers });
  };
}
