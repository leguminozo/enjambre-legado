import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RedeemSchema = z.object({
  reward_id: z.string().uuid(),
  idempotency_key: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = RedeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { reward_id, idempotency_key } = parsed.data;

  const { data, error } = await supabase.rpc('redeem_loyalty_reward', {
    p_user_id: user.id,
    p_reward_id: reward_id,
    p_idempotency_key: idempotency_key || null,
  });

  if (error) {
    console.error('[loyalty/redeem] rpc error:', error);
    return NextResponse.json(
      { error: 'Failed to process redemption' },
      { status: 500 }
    );
  }

  if (data?.error) {
    return NextResponse.json(
      data,
      { status: data.status || 400 }
    );
  }

  return NextResponse.json(data);
}
