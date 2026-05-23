import { createClient } from '@supabase/supabase-js';

function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) return { url, anonKey };

  return { url: '', anonKey: '' };
}

const { url, anonKey } = getSupabaseConfig();

if (!url || !anonKey) {
  console.warn(
    'Sin conexión al servidor. Verifica la configuración de la app.'
  );
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
