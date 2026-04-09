/** Clave pública: publishable (nuevo) o anon clásica. */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL');
  return url;
}

export function getSupabaseKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      'Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }
  return key;
}

