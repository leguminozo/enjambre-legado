import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardMutation } from '@/lib/api-guard';

const SubscribeSchema = z.object({
  producto_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 },
    );
  }

  const { producto_id } = parsed.data;

  const { error } = await supabase
    .from('back_in_stock_subscriptions')
    .upsert(
      { user_id: user.id, producto_id, status: 'pending' },
      { onConflict: 'user_id,producto_id' },
    );

  if (error) {
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const producto_id = searchParams.get('producto_id');

  if (!producto_id) {
    return NextResponse.json(
      { error: 'producto_id required' },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from('back_in_stock_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('producto_id', producto_id);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
