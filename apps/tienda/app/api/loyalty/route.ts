import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { buildUnifiedTierDisplay } from '@/lib/shop/tier-display';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [transactions, redemptions, rewards, tier, guardian] = await Promise.all([
    supabase
      .from('loyalty_transactions')
      .select('id, action_type, points, balance_after, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('loyalty_redemptions')
      .select('id, reward_id, points_spent, status, created_at, loyalty_rewards(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('loyalty_rewards')
      .select('id, name, description, points_cost, reward_type')
      .eq('active', true)
      .order('points_cost'),
    supabase
      .from('puntos_fidelizacion')
      .select('puntos, nivel_actual')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_tier_view')
      .select('ciclos_historicos, tier')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const tierDisplay = buildUnifiedTierDisplay({
    ciclosHistoricos: guardian.data?.ciclos_historicos ?? 0,
    loyaltyNivel: tier.data?.nivel_actual,
  });

  return NextResponse.json({
    balance: tier.data?.puntos ?? 0,
    tier: tierDisplay.loyaltyNivel,
    tierDisplay,
    transactions: transactions.data ?? [],
    redemptions: redemptions.data ?? [],
    rewards: rewards.data ?? [],
  });
}
