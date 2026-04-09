import { createClient } from '@/utils/supabase/server';
import { slugify } from '@/lib/shop/slug';
import { NextResponse } from 'next/server';

type ProductInput = {
  id?: string;
  nombre: string;
  descripcion_regenerativa?: string | null;
  precio: number;
  stock?: number | null;
  formato?: string | null;
  fotos?: string[];
  visible?: boolean;
  slug?: string | null;
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
    .from('productos')
    .select('id, slug, nombre, descripcion_regenerativa, precio, stock, formato, fotos, visible, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const body = (await req.json()) as ProductInput;
  if (!body?.nombre?.trim()) return NextResponse.json({ error: 'Falta nombre' }, { status: 400 });
  if (typeof body.precio !== 'number') return NextResponse.json({ error: 'Falta precio' }, { status: 400 });

  const fotos = Array.isArray(body.fotos) ? body.fotos : [];
  const slug = (body.slug?.trim() || slugify(body.nombre))?.slice(0, 120);

  const payload = {
    nombre: body.nombre.trim(),
    descripcion_regenerativa: body.descripcion_regenerativa ?? null,
    precio: Math.round(body.precio),
    stock: body.stock ?? null,
    formato: body.formato ?? null,
    fotos,
    visible: body.visible ?? true,
    slug,
  };

  const { data, error } = await supabase.from('productos').insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const body = (await req.json()) as ProductInput;
  if (!body?.id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  const fotos = body.fotos ? (Array.isArray(body.fotos) ? body.fotos : []) : undefined;
  const slug = body.slug != null ? (body.slug.trim() || slugify(body.nombre || '')) : undefined;

  const patch: Record<string, unknown> = {};
  if (body.nombre != null) patch.nombre = body.nombre.trim();
  if (body.descripcion_regenerativa !== undefined) patch.descripcion_regenerativa = body.descripcion_regenerativa;
  if (body.precio != null) patch.precio = Math.round(body.precio);
  if (body.stock !== undefined) patch.stock = body.stock;
  if (body.formato !== undefined) patch.formato = body.formato;
  if (fotos !== undefined) patch.fotos = fotos;
  if (body.visible !== undefined) patch.visible = body.visible;
  if (slug !== undefined) patch.slug = slugify(slug);

  const { data, error } = await supabase.from('productos').update(patch).eq('id', body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

