import { createAdminClient } from '@enjambre/auth/server-index';
import { z } from 'zod';
import { fromLoose } from '@/api/lib/supabase-loose';

export type SubscriptionCheckoutSession = {
  buyOrder: string;
  sessionId: string;
  provider: 'transbank' | 'flow';
  userId: string;
  planId: string;
  total: number;
  deliveryAddress?: string | null;
  /** Token de la inscripción recurrente Flow (Pago Automático) */
  recurringToken?: string | null;
  createdAt: number;
};

const SubscriptionSessionRowSchema = z.object({
  buy_order: z.string(),
  session_id: z.string(),
  provider: z.enum(['transbank', 'flow']),
  user_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  total: z.number(),
  delivery_address: z.string().nullable().optional(),
  recurring_token: z.string().nullable().optional(),
  status: z.enum(['pending', 'completed', 'expired']),
  created_at: z.string(),
});

function toSession(row: z.infer<typeof SubscriptionSessionRowSchema>): SubscriptionCheckoutSession {
  return {
    buyOrder: row.buy_order,
    sessionId: row.session_id,
    provider: row.provider,
    userId: row.user_id,
    planId: row.plan_id,
    total: row.total,
    deliveryAddress: row.delivery_address ?? null,
    recurringToken: row.recurring_token ?? null,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function saveSubscriptionCheckoutSession(
  session: SubscriptionCheckoutSession,
): Promise<void> {
  const admin = createAdminClient({ persistSession: false });
  // fromLoose: recurring_token aún no está en el typegen (migración 20260803)
  const { error } = await fromLoose(admin, 'subscription_checkout_sessions').insert({
    buy_order: session.buyOrder,
    session_id: session.sessionId,
    provider: session.provider,
    user_id: session.userId,
    plan_id: session.planId,
    total: session.total,
    delivery_address: session.deliveryAddress ?? null,
    recurring_token: session.recurringToken ?? null,
  });
  if (error) throw new Error(`Failed to save subscription checkout session: ${error.message}`);
}

export async function getSubscriptionCheckoutSession(
  buyOrder: string,
): Promise<SubscriptionCheckoutSession | undefined> {
  const admin = createAdminClient({ persistSession: false });
  // fromLoose: recurring_token aún no está en el typegen
  const { data, error } = await fromLoose(admin, 'subscription_checkout_sessions')
    .select('buy_order, session_id, provider, user_id, plan_id, total, delivery_address, recurring_token, status, created_at')
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
  const admin = createAdminClient({ persistSession: false });
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