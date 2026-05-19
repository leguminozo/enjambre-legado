import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const OrderPatchSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']).optional(),
});

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

  const raw = await req.json();
  const parsed = OrderPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const body = parsed.data;
  const patch: Record<string, unknown> = {};
  if (body.estado !== undefined) patch.estado = body.estado;

  const { data, error } = await supabase.from('ventas').update(patch).eq('id', body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
