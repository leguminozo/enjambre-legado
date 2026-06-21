/** Resuelve clave pública Supabase (anon JWT o publishable). */
export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
    ''
  );
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
}