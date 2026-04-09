import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

type PatchBody = {
  id: string;
  estado?: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 }) };
  }
  if (profile.role !== 'tienda_admin' && profile.role !== 'gerente') {
    return { error: NextResponse.json({ error: 'Sin permisos' }, { status: 403 }) };
  }
  return { supabase };
}

export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { data, error } = await supabase
    .from('ventas')
    .select('id, origen, estado, total, metodo_pago, items, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const body = (await req.json()) as PatchBody;
  if (!body?.id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (body.estado !== undefined) patch.estado = body.estado;

  const { data, error } = await supabase.from('ventas').update(patch).eq('id', body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

