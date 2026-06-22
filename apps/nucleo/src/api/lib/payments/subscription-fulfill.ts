import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionCheckoutSession } from './subscription-sessions';
import { completeSubscriptionCheckoutSession } from './subscription-sessions';

type FulfillSubscriptionInput = {
  buyOrder: string;
  session: SubscriptionCheckoutSession;
  authorizationCode?: string;
  paymentProvider: 'transbank' | 'flow';
};

type FulfillSubscriptionResult = {
  ok: boolean;
  subscriptionId?: string;
  alreadyProcessed?: boolean;
  error?: string;
};

function periodMonthsForFrequency(frequency: string): number {
  if (frequency === 'monthly') return 1;
  if (frequency === 'quarterly') return 3;
  return 12;
}

export async function fulfillSubscription(
  admin: SupabaseClient,
  input: FulfillSubscriptionInput,
): Promise<FulfillSubscriptionResult> {
  const { buyOrder, session, authorizationCode, paymentProvider } = input;

  const { data: completedSession } = await admin
    .from('subscription_checkout_sessions')
    .select('id')
    .eq('buy_order', buyOrder)
    .eq('status', 'completed')
    .maybeSingle();

  if (completedSession) {
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', session.userId)
      .in('status', ['active', 'trialing', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      ok: true,
      subscriptionId: existingSub?.id,
      alreadyProcessed: true,
    };
  }

  const { data: plan, error: planError } = await admin
    .from('subscription_plans')
    .select('id, frequency, active, included_items')
    .eq('id', session.planId)
    .single();

  if (planError || !plan || !plan.active) {
    return { ok: false, error: 'Plan no disponible' };
  }

  const { data: activeSub } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', session.userId)
    .in('status', ['active', 'trialing', 'paused'])
    .limit(1)
    .maybeSingle();

  if (activeSub) {
    await completeSubscriptionCheckoutSession(buyOrder, authorizationCode);
    return { ok: true, subscriptionId: activeSub.id, alreadyProcessed: true };
  }

  const periodMonths = periodMonthsForFrequency(plan.frequency);
  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + periodMonths);

  const { data: subscription, error: subError } = await admin
    .from('subscriptions')
    .insert({
      user_id: session.userId,
      plan_id: session.planId,
      status: 'active',
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      metadata: {
        buy_order: buyOrder,
        payment_provider: paymentProvider,
        authorization_code: authorizationCode ?? null,
        amount_clp: session.total,
      },
    })
    .select('id')
    .single();

  if (subError || !subscription) {
    console.error('[subscription-fulfill] insert failed:', subError);
    return { ok: false, error: 'No se pudo crear la suscripción' };
  }

  const { error: deliveryError } = await admin.from('subscription_deliveries').insert({
    subscription_id: subscription.id,
    period_number: 1,
    scheduled_for: periodStart.toISOString(),
    items: plan.included_items ?? [],
    status: 'scheduled',
  });

  if (deliveryError) {
    console.error('[subscription-fulfill] first delivery insert failed:', deliveryError.message);
  }

  await completeSubscriptionCheckoutSession(buyOrder, authorizationCode);

  return { ok: true, subscriptionId: subscription.id, alreadyProcessed: false };
}