import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

type AdminGuard = { supabase: Awaited<ReturnType<typeof createClient>>; userId: string };

export async function requireAdmin(): Promise<AdminGuard | { error: NextResponse }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 }) };
  }
  if (profile.role !== 'tienda_admin' && profile.role !== 'gerente') {
    return { error: NextResponse.json({ error: 'Sin permisos' }, { status: 403 }) };
  }

  return { supabase, userId: profile.id };
}
