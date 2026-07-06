import type { SupabaseClient } from '@supabase/supabase-js';
import { SUBSCRIPTION_VISIBLE_STATUSES } from '@/lib/shop/subscription-status';

export type SubscriptionManageAction = 'pause' | 'resume' | 'cancel';

export type SubscriptionPatchResult =
  | { ok: true; status: string }
  | { ok: false; code: 'not_found' | 'db_error'; message: string };

const SUBSCRIPTION_SELECT =
  'id, status, current_period_start, current_period_end, next_selection, pause_scheduled_until, metadata, subscription_plans(id, name, key, price_clp, frequency, description)';

const SUBSCRIPTION_SELECT_AGENT =
  'id, status, subscription_plans(name, frequency, price_clp), current_period_end, pause_scheduled_until';

export async function findUserSubscription(
  supabase: SupabaseClient,
  userId: string,
  select = SUBSCRIPTION_SELECT,
) {
  return supabase
    .from('subscriptions')
    .select(select)
    .eq('user_id', userId)
    .in('status', [...SUBSCRIPTION_VISIBLE_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function fetchSubscriptionDeliveries(
  supabase: SupabaseClient,
  subscriptionId: string,
  order: 'asc' | 'desc' = 'asc',
) {
  const ascending = order === 'asc';
  return supabase
    .from('subscription_deliveries')
    .select('id, period_number, scheduled_for, items, status, tracking_url')
    .eq('subscription_id', subscriptionId)
    .order(ascending ? 'scheduled_for' : 'period_number', { ascending })
    .limit(6);
}

export async function fetchActiveSubscriptionPlans(supabase: SupabaseClient) {
  return supabase
    .from('subscription_plans')
    .select('id, name, key, price_clp, frequency, description, included_items')
    .eq('active', true)
    .order('price_clp');
}

type SubscriptionRow = { id: string };

function subscriptionId(row: unknown): string | null {
  if (typeof row !== 'object' || row === null || !('id' in row)) return null;
  const id = (row as SubscriptionRow).id;
  return typeof id === 'string' ? id : null;
}

export async function fetchSubscriptionApiBundle(supabase: SupabaseClient, userId: string) {
  const { data: subscription } = await findUserSubscription(supabase, userId);
  const subId = subscriptionId(subscription);

  const [deliveries, plans] = await Promise.all([
    subId
      ? fetchSubscriptionDeliveries(supabase, subId, 'asc')
      : Promise.resolve({ data: [] as never[] }),
    fetchActiveSubscriptionPlans(supabase),
  ]);

  return {
    subscription: subscription ?? null,
    deliveries: deliveries.data ?? [],
    plans: plans.data ?? [],
  };
}

export async function fetchAgentSubscription(supabase: SupabaseClient, userId: string) {
  const { data: subscription } = await findUserSubscription(
    supabase,
    userId,
    SUBSCRIPTION_SELECT_AGENT,
  );
  return subscription ?? null;
}

export async function patchUserSubscription(
  supabase: SupabaseClient,
  userId: string,
  action: SubscriptionManageAction,
  resumeAt?: string | null,
): Promise<SubscriptionPatchResult> {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('user_id', userId)
    .in('status', [...SUBSCRIPTION_VISIBLE_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    return { ok: false, code: 'not_found', message: 'No active replenishment' };
  }

  if (action === 'pause') {
    if (subscription.status === 'past_due') {
      return { ok: false, code: 'not_found', message: 'Cannot pause past due replenishment' };
    }

    if (subscription.status === 'paused') {
      return { ok: true, status: 'paused' };
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({ pause_scheduled_until: resumeAt ?? null, status: 'paused' })
      .eq('id', subscription.id);

    if (error) return { ok: false, code: 'db_error', message: 'Failed to pause' };
    return { ok: true, status: 'paused' };
  }

  if (action === 'resume') {
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      return { ok: true, status: subscription.status };
    }

    if (subscription.status === 'past_due') {
      return { ok: false, code: 'not_found', message: 'Payment required before resuming' };
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'active', pause_scheduled_until: null })
      .eq('id', subscription.id);

    if (error) return { ok: false, code: 'db_error', message: 'Failed to resume' };
    return { ok: true, status: 'active' };
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'canceled', canceled_at: new Date().toISOString() })
    .eq('id', subscription.id);

  if (error) return { ok: false, code: 'db_error', message: 'Failed to cancel' };
  return { ok: true, status: 'canceled' };
}