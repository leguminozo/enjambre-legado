import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabaseKey, getSupabaseUrl, isSupabaseConfigured } from './env';

/** null si faltan env (evita 500 SSR en Vercel sin variables). */
export async function createClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
} catch (error) {
      console.error('[campo-supabase-server] cookie set error:', error);
    }
      },
    },
  });
}
