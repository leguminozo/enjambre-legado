import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, status, current_period_start, current_period_end, next_selection, pause_scheduled_until, subscription_plans(name, key, price_clp, frequency)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const [deliveries, plans] = await Promise.all([
    supabase
      .from('subscription_deliveries')
      .select('id, period_number, scheduled_for, items, status, tracking_url')
      .eq('subscription_id', subscription?.id ?? '')
      .order('period_number', { ascending: false })
      .limit(6),
    supabase
      .from('subscription_plans')
      .select('id, name, key, price_clp, frequency, description, included_items')
      .eq('active', true)
      .order('price_clp'),
  ]);

  return NextResponse.json({
    subscription: subscription ?? null,
    deliveries: deliveries.data ?? [],
    plans: plans.data ?? [],
  });
}

const SubscribeSchema = await import('zod').then((z) =>
  z.object({
    plan_id: z.string().uuid(),
  }),
);

export async function POST(request: NextRequest) {
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
      { error: 'Invalid request', details: parsed.success },
      { status: 400 },
    );
  }

  const { plan_id } = parsed.data;

  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('id, key, frequency')
    .eq('id', plan_id)
    .eq('active', true)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  const periodMonths =
    plan.frequency === 'monthly'
      ? 1
      : plan.frequency === 'quarterly'
        ? 3
        : 12;

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + periodMonths);

  const { error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan_id,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    });

  if (subError) {
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
