import { requireAdmin } from '@/lib/require-admin';
import { slugify } from '@/lib/shop/slug';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ProductCreateSchema = z.object({
  nombre: z.string().min(1).max(200),
  descripcion_regenerativa: z.string().max(2000).nullable().optional(),
  precio: z.number().int().nonnegative(),
  stock: z.number().int().nullable().optional(),
  formato: z.string().max(100).nullable().optional(),
  fotos: z.array(z.string().url()).optional(),
  visible: z.boolean().optional(),
  slug: z.string().max(120).nullable().optional(),
});

const ProductPatchSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1).max(200).optional(),
  descripcion_regenerativa: z.string().max(2000).nullable().optional(),
  precio: z.number().int().nonnegative().optional(),
  stock: z.number().int().nullable().optional(),
  formato: z.string().max(100).nullable().optional(),
  fotos: z.array(z.string().url()).optional(),
  visible: z.boolean().optional(),
  slug: z.string().max(120).nullable().optional(),
});

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

  const raw = await req.json();
  const parsed = ProductCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const body = parsed.data;
  const fotos = body.fotos ?? [];
  const slug = (body.slug?.trim() || slugify(body.nombre))?.slice(0, 120);

  const payload = {
    nombre: body.nombre.trim(),
    descripcion_regenerativa: body.descripcion_regenerativa ?? null,
    precio: body.precio,
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

  const raw = await req.json();
  const parsed = ProductPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const body = parsed.data;
  const fotos = body.fotos ? (Array.isArray(body.fotos) ? body.fotos : []) : undefined;
  const slug = body.slug != null ? (body.slug.trim() || slugify(body.nombre || '')) : undefined;

  const patch: Record<string, unknown> = {};
  if (body.nombre != null) patch.nombre = body.nombre.trim();
  if (body.descripcion_regenerativa !== undefined) patch.descripcion_regenerativa = body.descripcion_regenerativa;
  if (body.precio != null) patch.precio = body.precio;
  if (body.stock !== undefined) patch.stock = body.stock;
  if (body.formato !== undefined) patch.formato = body.formato;
  if (fotos !== undefined) patch.fotos = fotos;
  if (body.visible !== undefined) patch.visible = body.visible;
  if (slug !== undefined) patch.slug = slugify(slug);

  const { data, error } = await supabase.from('productos').update(patch).eq('id', body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
