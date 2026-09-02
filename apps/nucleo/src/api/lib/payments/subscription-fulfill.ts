import { SUBSCRIPTION_BLOCKING_STATUSES } from '@enjambre/pricing';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionCheckoutSession } from './subscription-sessions';
import { completeSubscriptionCheckoutSession } from './subscription-sessions';
import { fromLoose } from '@/api/lib/supabase-loose';

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

export type RecurringChargeInput = {
  subscriptionId: string;
  flowOrder: number;
  amount: number;
  chargedAt?: string;
};

export type FulfillRecurringChargeResult = {
  ok: boolean;
  alreadyProcessed?: boolean;
  error?: string;
};

function periodMonthsForFrequency(frequency: string): number {
  if (frequency === 'monthly') return 1;
  if (frequency === 'quarterly') return 3;
  return 12;
}

/** Plan digital (included_items con {"type":"digital"}): no agenda entregas
 *  físicas — el motor de deliveries y el heal del cron lo omiten. */
function esPlanDigital(includedItems: unknown): boolean {
  return (
    Array.isArray(includedItems) &&
    includedItems.some(
      (i) => typeof i === 'object' && i !== null && (i as { type?: string }).type === 'digital',
    )
  );
}

/** Flow order numérico válido (>0). Rechaza "" / NaN / 0 que colisionarían en UNIQUE. */
export function parseFlowOrder(authorizationCode?: string | null): number | null {
  if (authorizationCode == null || authorizationCode === '') return null;
  const n = Number(authorizationCode);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

/** Sumar meses sin desbordar el fin de mes (31 ene → 28/29 feb, no 2-3 mar). */
export function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setDate(1);
  result.setMonth(targetMonth);
  const daysInTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(date.getDate(), daysInTargetMonth));
  return result;
}

async function nextPeriodNumber(admin: SupabaseClient, subscriptionId: string): Promise<number> {
  const { data } = await admin
    .from('subscription_deliveries')
    .select('period_number')
    .eq('subscription_id', subscriptionId)
    .order('period_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.period_number as number | undefined) ?? 0) + 1;
}

async function insertRecurringCharge(
  admin: SupabaseClient,
  charge: { subscriptionId: string; periodNumber: number; flowOrder: number; amount: number; status: 'paid' | 'failed'; chargedAt?: string },
): Promise<void> {
  const { error } = await admin.from('subscription_charges').insert({
    subscription_id: charge.subscriptionId,
    period_number: charge.periodNumber,
    flow_order: charge.flowOrder,
    amount: charge.amount,
    status: charge.status,
    charged_at: charge.chargedAt ?? new Date().toISOString(),
  });
  if (error) {
    // 23505: race concurrente con el mismo flow_order (idempotente)
    const code = (error as { code?: string }).code;
    if (code === '23505' || /duplicate|unique/i.test(error.message ?? '')) {
      return;
    }
    console.error('[subscription-fulfill] insertRecurringCharge failed:', error.message);
  }
}

/** Primer cargo (inscripción / reactivación): ancla flow_order para que el webhook
 *  post-commit no avance el período otra vez vía fulfillRecurringCharge. */
async function recordInitialChargeIfAny(
  admin: SupabaseClient,
  subscriptionId: string,
  periodNumber: number,
  authorizationCode: string | undefined,
  amount: number,
): Promise<void> {
  const flowOrder = parseFlowOrder(authorizationCode);
  if (flowOrder == null) return;
  await insertRecurringCharge(admin, {
    subscriptionId,
    periodNumber,
    flowOrder,
    amount: Math.max(0, Math.round(amount)),
    status: 'paid',
  });
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
      .in('status', [...SUBSCRIPTION_BLOCKING_STATUSES])
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
    .select('id, status')
    .eq('user_id', session.userId)
    .eq('plan_id', session.planId)
    .in('status', [...SUBSCRIPTION_BLOCKING_STATUSES])
    .limit(1)
    .maybeSingle();

  if (activeSub) {
    if (activeSub.status === 'paused') {
      // Reanudar = nueva autorización pagada: reactivar con la nueva inscripción
      const periodMonths = periodMonthsForFrequency(plan.frequency);
      const periodStart = new Date();
      const periodEnd = addMonthsClamped(periodStart, periodMonths);
      const metadata = {
        buy_order: buyOrder,
        payment_provider: paymentProvider,
        authorization_code: authorizationCode ?? null,
        amount_clp: session.total,
        delivery_address: session.deliveryAddress ?? null,
      };

      const { error: reactivateError } = await fromLoose(admin, 'subscriptions')
        .update({
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          pause_scheduled_until: null,
          metadata,
          flow_inscription_token: session.recurringToken ?? null,
          flow_inscription_buy_order: buyOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeSub.id);

      if (reactivateError) {
        console.error('[subscription-fulfill] paused reactivate failed:', reactivateError);
        return { ok: false, error: 'No se pudo reactivar la reposición' };
      }

      const nextPeriod = await nextPeriodNumber(admin, activeSub.id);
      if (!esPlanDigital(plan.included_items)) {
        const { error: deliveryError } = await admin.from('subscription_deliveries').insert({
          subscription_id: activeSub.id,
          period_number: nextPeriod,
          scheduled_for: periodEnd.toISOString(),
          items: plan.included_items ?? [],
          status: 'scheduled',
        });
        if (deliveryError) {
          console.error('[subscription-fulfill] reactivate delivery insert failed:', deliveryError.message);
        }
      }

      await recordInitialChargeIfAny(admin, activeSub.id, nextPeriod, authorizationCode, session.total);
      await completeSubscriptionCheckoutSession(buyOrder, authorizationCode);
      return { ok: true, subscriptionId: activeSub.id, alreadyProcessed: false };
    }

    await completeSubscriptionCheckoutSession(buyOrder, authorizationCode);
    return { ok: true, subscriptionId: activeSub.id, alreadyProcessed: true };
  }

  const periodMonths = periodMonthsForFrequency(plan.frequency);
  const periodStart = new Date();
  const periodEnd = addMonthsClamped(periodStart, periodMonths);

  const metadata = {
    buy_order: buyOrder,
    payment_provider: paymentProvider,
    authorization_code: authorizationCode ?? null,
    amount_clp: session.total,
    delivery_address: session.deliveryAddress ?? null,
  };

  const { data: pastDueSub } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', session.userId)
    .eq('plan_id', session.planId)
    .eq('status', 'past_due')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pastDueSub) {
    // fromLoose: flow_inscription_* aún no está en el typegen (migración 20260803)
    const { error: renewError } = await fromLoose(admin, 'subscriptions')
      .update({
        plan_id: session.planId,
        status: 'active',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        pause_scheduled_until: null,
        metadata,
        flow_inscription_token: session.recurringToken ?? null,
        flow_inscription_buy_order: buyOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pastDueSub.id);

    if (renewError) {
      console.error('[subscription-fulfill] past_due renew failed:', renewError);
      return { ok: false, error: 'No se pudo reactivar la reposición' };
    }

    // Heal bug #6: el período recién pagado también agenda su entrega
    const nextPeriod = await nextPeriodNumber(admin, pastDueSub.id);
    const { error: deliveryError } = await admin.from('subscription_deliveries').insert({
      subscription_id: pastDueSub.id,
      period_number: nextPeriod,
      scheduled_for: periodEnd.toISOString(),
      items: plan.included_items ?? [],
      status: 'scheduled',
    });
    if (deliveryError) {
      console.error('[subscription-fulfill] past_due delivery insert failed:', deliveryError.message);
    }

    await recordInitialChargeIfAny(admin, pastDueSub.id, nextPeriod, authorizationCode, session.total);
    await completeSubscriptionCheckoutSession(buyOrder, authorizationCode);
    return { ok: true, subscriptionId: pastDueSub.id, alreadyProcessed: false };
  }

  const { data: subscription, error: subError } = await fromLoose(admin, 'subscriptions')
    .insert({
      user_id: session.userId,
      plan_id: session.planId,
      status: 'active',
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      metadata,
      flow_inscription_token: session.recurringToken ?? null,
      flow_inscription_buy_order: buyOrder,
    })
    .select('id')
    .single();

  if (subError || !subscription) {
    console.error('[subscription-fulfill] insert failed:', subError);
    return { ok: false, error: 'No se pudo crear la suscripción' };
  }

  // Primera entrega al FINAL del período (consistente con "próxima entrega =
  // current_period_end" que muestra la UI; antes se agendaba el día de compra).
  // Los planes digitales no agendan entregas físicas.
  if (!esPlanDigital(plan.included_items)) {
    const { error: deliveryError } = await admin.from('subscription_deliveries').insert({
      subscription_id: subscription.id,
      period_number: 1,
      scheduled_for: periodEnd.toISOString(),
      items: plan.included_items ?? [],
      status: 'scheduled',
    });

    if (deliveryError) {
      console.error('[subscription-fulfill] first delivery insert failed:', deliveryError.message);
    }
  }

  await recordInitialChargeIfAny(admin, subscription.id as string, 1, authorizationCode, session.total);
  await completeSubscriptionCheckoutSession(buyOrder, authorizationCode);

  return { ok: true, subscriptionId: subscription.id, alreadyProcessed: false };
}

/**
 * Cargo recurrente llegado por webhook de Flow. Idempotente por flow_order.
 * - sub activa/trialing: avanza el período y agenda la entrega del nuevo período
 * - sub past_due: reactiva y agenda
 * - sub cancelada/pausada: registra el cargo (auditoría/refund manual) sin agendar
 */
export async function fulfillRecurringCharge(
  admin: SupabaseClient,
  input: RecurringChargeInput,
): Promise<FulfillRecurringChargeResult> {
  const { subscriptionId, amount } = input;
  const flowOrder = Number(input.flowOrder);

  // flow_order 0/NaN colisiona en UNIQUE y silenciaba cargos reales
  if (!Number.isFinite(flowOrder) || flowOrder <= 0) {
    return { ok: false, error: 'flowOrder inválido' };
  }

  const { data: existing } = await admin
    .from('subscription_charges')
    .select('id')
    .eq('flow_order', flowOrder)
    .maybeSingle();

  if (existing) {
    return { ok: true, alreadyProcessed: true };
  }

  const { data: sub, error: subError } = await admin
    .from('subscriptions')
    .select('id, user_id, plan_id, status, current_period_end')
    .eq('id', subscriptionId)
    .single();

  if (subError || !sub) {
    return { ok: false, error: 'Suscripción no encontrada' };
  }

  const { data: plan } = await admin
    .from('subscription_plans')
    .select('id, frequency, included_items')
    .eq('id', sub.plan_id)
    .single();

  if (!plan) {
    return { ok: false, error: 'Plan no encontrado' };
  }

  if (sub.status === 'canceled' || sub.status === 'paused') {
    // Cargo no esperado: se registra para auditoría; no se agenda entrega
    await insertRecurringCharge(admin, {
      subscriptionId,
      periodNumber: 0,
      flowOrder,
      amount,
      status: 'paid',
      chargedAt: input.chargedAt,
    });
    console.warn(`[subscription-fulfill] cargo recurrente en sub ${sub.status} (${subscriptionId}), revisar refund`);
    return { ok: true, alreadyProcessed: false };
  }

  const periodMonths = periodMonthsForFrequency(plan.frequency);
  const isPastDue = sub.status === 'past_due';
  const newStart = isPastDue ? new Date() : sub.current_period_end ? new Date(sub.current_period_end) : new Date();
  const newEnd = addMonthsClamped(newStart, periodMonths);

  const nextPeriod = await nextPeriodNumber(admin, subscriptionId);

  const { error: updateError } = await admin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: newStart.toISOString(),
      current_period_end: newEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  if (updateError) {
    console.error('[subscription-fulfill] recurring roll failed:', updateError);
    return { ok: false, error: 'No se pudo avanzar el período' };
  }

  await insertRecurringCharge(admin, {
    subscriptionId,
    periodNumber: nextPeriod,
    flowOrder,
    amount,
    status: 'paid',
    chargedAt: input.chargedAt,
  });

  if (!esPlanDigital(plan.included_items)) {
    const { error: deliveryError } = await admin.from('subscription_deliveries').insert({
      subscription_id: subscriptionId,
      period_number: nextPeriod,
      scheduled_for: newEnd.toISOString(),
      items: plan.included_items ?? [],
      status: 'scheduled',
    });

    if (deliveryError) {
      console.error('[subscription-fulfill] recurring delivery insert failed:', deliveryError.message);
    }
  }

  return { ok: true, alreadyProcessed: false };
}
