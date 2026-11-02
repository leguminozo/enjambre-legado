import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardMutation } from '@/lib/api-guard';
import { createRouteRateLimiter } from '@/lib/ratelimit-route';

const PreOrderSchema = z.object({
  producto_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  quantity: z.number().int().min(1).max(10).default(1),
  notas: z.string().max(500).optional(),
  edicion_id: z.string().uuid().optional(),
});

const BONO_RESERVA_PUNTOS = 50;

const checkRateLimit = createRouteRateLimiter({ windowMs: 60_000, maxRequests: 5 });

export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const rateLimited = checkRateLimit(request);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = PreOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { producto_id, email, quantity, notas, edicion_id } = parsed.data;
  const userId = user?.id ?? null;

  if (!userId && !email) {
    return NextResponse.json(
      { error: 'Authentication or email required' },
      { status: 400 },
    );
  }

  // Edición limitada: ventana abierta, activa y con cupo (fail-closed acá:
  // el cupo es el corazón de la edición).
  if (edicion_id) {
    const { data: edicion } = await supabase
      .from('ediciones_limitadas')
      .select('id, producto_id, abre_at, cierra_at, cupo_max, activa')
      .eq('id', edicion_id)
      .maybeSingle();
    const ahora = new Date().toISOString();
    if (!edicion || !edicion.activa || edicion.abre_at > ahora || edicion.cierra_at <= ahora) {
      return NextResponse.json({ error: 'La edición ya no recibe reservas' }, { status: 409 });
    }
    const { data: usados } = await supabase.rpc('edicion_cupo_usado', { p_edicion_id: edicion_id });
    if (typeof usados === 'number' && usados + quantity > edicion.cupo_max) {
      return NextResponse.json({ error: 'Cupo de la edición agotado' }, { status: 409 });
    }
  }

  // Verificar si el usuario pertenece al Club Legado para otorgar prioridad de asignación
  let prioridadClub = false;
  if (userId) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (sub) {
      prioridadClub = true;
    }
  }

  const baseRow = {
    user_id: userId,
    producto_id: producto_id ?? null,
    email: email ?? (user?.email ?? null),
    quantity,
    status: 'reserved',
    prioridad_club: prioridadClub,
    notas: notas ?? null,
  };

  // edicion_id vive en la migración 20260922150000: si el esquema aún no la
  // tiene (deploy antes que DB), se crea la reserva base sin edición.
  // El cast cubre el desfase de typegen (`pnpm db:typegen` tras migrar).
  let preOrderId: string;
  let sinEdicion = false;
  {
    const payload = (
      edicion_id ? { ...baseRow, edicion_id } : baseRow
    ) as typeof baseRow;
    const { data, error } = await supabase.from('pre_orders').insert(payload).select('id').single();
    if (error && edicion_id && /edicion_id/i.test(error.message)) {
      const retry = await supabase.from('pre_orders').insert(baseRow).select('id').single();
      if (retry.error) {
        return NextResponse.json({ error: 'Failed to create pre-order' }, { status: 500 });
      }
      preOrderId = retry.data.id;
      sinEdicion = true;
    } else if (error || !data) {
      return NextResponse.json({ error: 'Failed to create pre-order' }, { status: 500 });
    } else {
      preOrderId = data.id;
    }
  }

  // Bono de reserva anticipada en ediciones (mejor esfuerzo, idempotente).
  let bono = false;
  if (edicion_id && userId && preOrderId && !sinEdicion) {
    try {
      const { createAdminClient } = await import('@/utils/supabase/admin');
      const admin = createAdminClient();
      if (admin) {
        const { error: bonoError } = await admin.from('loyalty_events_ledger').insert({
          user_id: userId,
          canal: 'web',
          tipo_evento: 'reserva_anticipada',
          delta_puntos: BONO_RESERVA_PUNTOS,
          idempotency_key: `reserva-bono-${preOrderId}`,
          referencia_tipo: 'pre_order',
          referencia_id: preOrderId,
          metadata: { edicion_id, quantity },
        });
        bono = !bonoError || bonoError.code === '23505';
      }
    } catch {
      // La reserva ya quedó; el bono reintenta en la confirmación
    }
  }

  return NextResponse.json(
    { success: true, pre_order_id: preOrderId, status: 'reserved', bono },
    { status: 201 },
  );
}
