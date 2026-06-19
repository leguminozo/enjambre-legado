import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

export type SubscriptionCheckoutSession = {
  buyOrder: string;
  sessionId: string;
  provider: 'transbank' | 'flow';
  userId: string;
  planId: string;
  total: number;
  createdAt: number;
};

const SubscriptionSessionRowSchema = z.object({
  buy_order: z.string(),
  session_id: z.string(),
  provider: z.enum(['transbank', 'flow']),
  user_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  total: z.number(),
  status: z.enum(['pending', 'completed', 'expired']),
  created_at: z.string(),
});

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials for admin client');
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function toSession(row: z.infer<typeof SubscriptionSessionRowSchema>): SubscriptionCheckoutSession {
  return {
    buyOrder: row.buy_order,
    sessionId: row.session_id,
    provider: row.provider,
    userId: row.user_id,
    planId: row.plan_id,
    total: row.total,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function saveSubscriptionCheckoutSession(
  session: SubscriptionCheckoutSession,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from('subscription_checkout_sessions').insert({
    buy_order: session.buyOrder,
    session_id: session.sessionId,
    provider: session.provider,
    user_id: session.userId,
    plan_id: session.planId,
    total: session.total,
  });
  if (error) throw new Error(`Failed to save subscription checkout session: ${error.message}`);
}

export async function getSubscriptionCheckoutSession(
  buyOrder: string,
): Promise<SubscriptionCheckoutSession | undefined> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('subscription_checkout_sessions')
    .select('buy_order, session_id, provider, user_id, plan_id, total, status, created_at')
    .eq('buy_order', buyOrder)
    .eq('status', 'pending')
    .single();

  if (error || !data) return undefined;
  const parsed = SubscriptionSessionRowSchema.safeParse(data);
  if (!parsed.success) {
    console.error('[subscription-checkout] session row schema mismatch:', parsed.error.flatten());
    return undefined;
  }
  return toSession(parsed.data);
}

export async function completeSubscriptionCheckoutSession(
  buyOrder: string,
  authorizationCode?: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('subscription_checkout_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      payment_authorization_code: authorizationCode ?? null,
    })
    .eq('buy_order', buyOrder)
    .eq('status', 'pending');
  if (error) throw new Error(`Failed to complete subscription checkout session: ${error.message}`);
}