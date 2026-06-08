import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RedeemSchema = z.object({
  reward_id: z.string().uuid(),
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

  const { reward_id } = parsed.data;

  const [rewardResult, profileResult] = await Promise.all([
    supabase
      .from('loyalty_rewards')
      .select('id, name, points_cost, active')
      .eq('id', reward_id)
      .single(),
    supabase
      .from('profiles')
      .select('puntos_acumulados')
      .eq('id', user.id)
      .single(),
  ]);

  if (rewardResult.error || !rewardResult.data) {
    return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
  }

  if (!rewardResult.data.active) {
    return NextResponse.json({ error: 'Reward unavailable' }, { status: 400 });
  }

  const balance = profileResult.data?.puntos_acumulados ?? 0;
  const cost = rewardResult.data.points_cost;

  if (balance < cost) {
    return NextResponse.json(
      { error: 'Insufficient points', balance, cost },
      { status: 400 },
    );
  }

  const newBalance = balance - cost;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ puntos_acumulados: newBalance })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to deduct points' },
      { status: 500 },
    );
  }

  const { error: txError } = await supabase
    .from('loyalty_transactions')
    .insert({
      user_id: user.id,
      action_type: 'compra' as const,
      points: -cost,
      balance_after: newBalance,
      source_id: reward_id,
      description: `Canje: ${rewardResult.data.name}`,
    });

  if (txError) {
    return NextResponse.json(
      { error: 'Failed to record transaction' },
      { status: 500 },
    );
  }

  const { error: redemptionError } = await supabase
    .from('loyalty_redemptions')
    .insert({
      user_id: user.id,
      reward_id,
      points_spent: cost,
      status: 'pending',
    });

  if (redemptionError) {
    return NextResponse.json(
      { error: 'Failed to create redemption' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    reward: rewardResult.data.name,
    points_spent: cost,
    new_balance: newBalance,
  });
}
