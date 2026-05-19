import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ContentCreateSchema = z.object({
  section_key: z.string().min(1).max(200),
  item_order: z.number().int().nonnegative().optional(),
  content: z.record(z.string(), z.unknown()),
  is_active: z.boolean().optional(),
});

const ContentPatchSchema = z.object({
  id: z.string().uuid(),
  section_key: z.string().min(1).max(200).optional(),
  item_order: z.number().int().nonnegative().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
});

const ContentDeleteSchema = z.object({
  id: z.string().uuid(),
});

export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .order('section_key', { ascending: true })
    .order('item_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const raw = await req.json();
  const parsed = ContentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const body = parsed.data;

  const { data, error } = await supabase
    .from('site_content')
    .insert({
      section_key: body.section_key.trim(),
      item_order: body.item_order ?? 0,
      content: body.content,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const raw = await req.json();
  const parsed = ContentPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const body = parsed.data;

  const patch: Record<string, unknown> = {};
  if (body.section_key !== undefined) patch.section_key = body.section_key;
  if (body.item_order !== undefined) patch.item_order = body.item_order;
  if (body.content !== undefined) patch.content = body.content;
  if (body.is_active !== undefined) patch.is_active = body.is_active;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('site_content')
    .update(patch)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const raw = await req.json();
  const parsed = ContentDeleteSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { error } = await supabase.from('site_content').delete().eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
