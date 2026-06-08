import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PreOrderSchema = z.object({
  producto_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  quantity: z.number().int().min(1).max(10).default(1),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const parsed = PreOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { producto_id, email, quantity } = parsed.data;
  const userId = user?.id ?? null;

  if (!userId && !email) {
    return NextResponse.json(
      { error: 'Authentication or email required' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('pre_orders')
    .insert({
      user_id: userId,
      producto_id: producto_id ?? null,
      email: email ?? null,
      quantity,
      status: 'reserved',
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create pre-order' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, pre_order_id: data.id, status: 'reserved' },
    { status: 201 },
  );
}
