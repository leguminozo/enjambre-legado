import { supabase } from '@/lib/supabase';

/** Resuelve empresa_id desde usuarios_empresas (no usar auth user.id como empresa). */
export async function resolveEmpresaId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('usuarios_empresas')
    .select('empresa_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.empresa_id ?? null;
}