import { SUBSCRIPTION_BLOCKING_STATUSES } from '@enjambre/pricing';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createAdminClient } from '@enjambre/auth/server-index';
import { getPaymentProvider } from '../lib/payments';
import { getNucleoPublicUrl } from '../lib/payments/flow-sign';
import type { PaymentInitResult, PaymentProviderWithRecurring } from '../lib/payments/types';
import {
  saveSubscriptionCheckoutSession,
  getSubscriptionCheckoutSession,
} from '../lib/payments/subscription-sessions';
import {
  fulfillRecurringCharge,
  fulfillSubscription,
  parseFlowOrder,
} from '../lib/payments/subscription-fulfill';
import { resolveCheckoutReturnUrl } from '../lib/payments/safe-return-url';
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '../lib/ratelimit';
import { fromLoose } from '@/api/lib/supabase-loose';

async function rateLimitMiddleware(
  c: {
    req: { header: (name: string) => string | undefined; ip?: string };
    json: (data: unknown, status: number) => Response;
    header: (name: string, value: string) => void;
  },
  config: { readonly limit: number; readonly window: `${number} ${'s' | 'm' | 'h' | 'd'}` },
) {
  const identifier = getClientIdentifier(c);
  const result = await checkRateLimit({ identifier, ...config });

  c.header('X-RateLimit-Limit', String(result.limit));
  c.header('X-RateLimit-Remaining', String(result.remaining));
  c.header('X-RateLimit-Reset', String(result.reset));

  if (!result.success) {
    c.header('Retry-After', String(result.retryAfter || 60));
    return c.json({ code: 'rate_limited', message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, 429);
  }
  return null;
}

const InitBodySchema = z.object({
  planId: z.string().uuid(),
  returnUrl: z.string().url().optional(),
  deliveryAddress: z.string().min(5).max(500).optional(),
});

const CommitBodySchema = z.object({
  token_ws: z.string().min(1).max(1024),
  buyOrder: z.string().min(1).max(1024).optional(),
  provider: z.enum(['transbank', 'flow']).optional(),
});

async function resolveUserFromToken(token: string | null) {
  if (!token) return null;
  const admin = createAdminClient({ persistSession: false });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export const subscriptionsCheckoutRoutes = new Hono();

subscriptionsCheckoutRoutes.post('/init', zValidator('json', InitBodySchema), async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.checkout);
  if (rateLimitResult) return rateLimitResult;

  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    const user = await resolveUserFromToken(token);

    if (!user) {
      return c.json({ code: 'unauthorized', message: 'Debes iniciar sesión' }, 401);
    }

    const { planId, returnUrl: rawReturnUrl, deliveryAddress } = c.req.valid('json');
    const admin = createAdminClient({ persistSession: false });

    const { data: plan, error: planError } = await admin
      .from('subscription_plans')
      .select('id, name, price_clp, frequency, active')
      .eq('id', planId)
      .single();

    if (planError || !plan || !plan.active) {
      return c.json({ code: 'plan_not_found', message: 'Plan no encontrado' }, 404);
    }

    // Una sub activa POR PLAN: el Club Legado del Bosque (miel) y los planes
    // territoriales digitales (Trazabilidad/Apiario Pro) pueden convivir.
    // Paused se EXCLUYE del bloqueo: reanudar = nueva autorización (el cliente
    // paga de nuevo y el fulfill reactiva la sub pausada)
    const { data: activeSub } = await admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('plan_id', planId)
      .in('status', [...SUBSCRIPTION_BLOCKING_STATUSES.filter((s) => s !== 'paused')])
      .limit(1)
      .maybeSingle();

    if (activeSub) {
      return c.json({ code: 'already_subscribed', message: 'Ya tienes una reposición activa' }, 409);
    }

    const total = Math.max(1, Math.round(plan.price_clp));
    // Cargo mensual equivalente: Pago Automático de Flow solo soporta períodos
    // day/week/month, así que trimestral/anual se fraccionan en cargos mensuales.
    const monthlyEquivalent =
      plan.frequency === 'quarterly'
        ? Math.max(1, Math.round(plan.price_clp / 3))
        : plan.frequency === 'annual'
          ? Math.max(1, Math.round(plan.price_clp / 12))
          : total;
    const buyOrder = `SUB-${crypto.randomUUID()}`;
    const sessionId = `sub-sess-${crypto.randomUUID()}`;

    // Same allowlist as one-shot checkout — no open redirect post-pago.
    const returnUrl = resolveCheckoutReturnUrl(
      rawReturnUrl,
      buyOrder,
      '/perfil/reposicion/resultado',
    );

    const provider = getPaymentProvider();
    const isRecurringCapable =
      provider.name === 'flow' &&
      typeof (provider as Partial<PaymentProviderWithRecurring>).createRecurring === 'function';
    const nucleoPublicUrl = getNucleoPublicUrl();

    let result: PaymentInitResult;
    let recurringToken: string | null = null;

    if (isRecurringCapable && nucleoPublicUrl) {
      // Inscripción Pago Automático: el primer cargo ocurre al autorizar en la
      // página de Flow; los siguientes los cobra Flow solo cada mes.
      const recurring = await (provider as PaymentProviderWithRecurring).createRecurring({
        buyOrder,
        sessionId,
        firstAmount: total,
        recurringAmount: monthlyEquivalent,
        email: user.email ?? '',
        returnUrl,
        confirmationUrl: `${nucleoPublicUrl}/api/checkout/webhook/flow`,
        planName: plan.name,
        optional: { planId: plan.id },
      });
      result = {
        url: recurring.url,
        token: recurring.token,
        buyOrder,
        sessionId,
        provider: provider.name,
      };
      recurringToken = recurring.token;
    } else {
      // Fallback one-shot (Transbank o Flow sin módulo recurrente habilitado)
      result = await provider.init(buyOrder, sessionId, total, returnUrl, user.email);
    }

    await saveSubscriptionCheckoutSession({
      buyOrder,
      sessionId,
      provider: provider.name,
      userId: user.id,
      planId: plan.id,
      total,
      deliveryAddress: deliveryAddress?.trim() || null,
      recurringToken,
      createdAt: Date.now(),
    });

    return c.json({
      url: result.url,
      token: result.token,
      buyOrder: result.buyOrder,
      sessionId: result.sessionId,
      total,
      provider: provider.name,
      planName: plan.name,
      recurring: Boolean(recurringToken),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar el pago de reposición';
    return c.json({ code: 'init_failed', message }, 500);
  }
});

subscriptionsCheckoutRoutes.post('/commit', zValidator('json', CommitBodySchema), async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.checkout);
  if (rateLimitResult) return rateLimitResult;

  try {
    const { token_ws, buyOrder: clientBuyOrder } = c.req.valid('json');
    const provider = getPaymentProvider();
    const result = await provider.commit(token_ws);

    if (!result.authorized) {
      return c.json({ ok: false, authorized: false, result: result.raw }, 200);
    }

    // Fuente de verdad: el buyOrder devuelto por el proveedor. Si el cliente
    // manda uno distinto, rechazamos (mismo criterio que el checkout one-shot).
    const buyOrder = result.buyOrder?.trim();
    if (!buyOrder?.startsWith('SUB-')) {
      return c.json({ ok: false, authorized: true, error: 'Orden de suscripción inválida', buyOrder }, 200);
    }
    if (clientBuyOrder && clientBuyOrder !== buyOrder) {
      console.warn(`[subscriptions-checkout] buyOrder mismatch client=${clientBuyOrder} provider=${buyOrder}`);
      return c.json({ code: 'buy_order_mismatch', message: 'buyOrder no coincide con el proveedor de pago' }, 400);
    }

    const session = await getSubscriptionCheckoutSession(buyOrder);

    if (!session) {
      // Doble commit / webhook ya procesó: sesión completed + sub activa.
      // Buscar por inscription (Flow reusa commerceOrder) y por metadata legacy.
      const admin = createAdminClient({ persistSession: false });
      const { data: byInscription } = await fromLoose(admin, 'subscriptions')
        .select('id')
        .eq('flow_inscription_buy_order', buyOrder)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const existingSubId =
        (byInscription?.id as string | undefined) ??
        (
          await admin
            .from('subscriptions')
            .select('id')
            .eq('metadata->>buy_order', buyOrder)
            .maybeSingle()
        ).data?.id;

      if (existingSubId) {
        return c.json({
          ok: true,
          authorized: true,
          buyOrder,
          subscriptionId: existingSubId as string,
          alreadyProcessed: true,
        }, 200);
      }

      console.error(`Subscription session not found for buyOrder: ${buyOrder}`);
      return c.json({
        ok: false,
        authorized: true,
        error: 'Sesión de pago expirada. Contacta soporte con orden ' + buyOrder,
        buyOrder,
      }, 200);
    }

    // Ownership: la sesión debe pertenecer al usuario autenticado
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    const user = await resolveUserFromToken(token);
    if (!user || user.id !== session.userId) {
      return c.json({ code: 'forbidden', message: 'Esta orden no te pertenece' }, 403);
    }

    const admin = createAdminClient({ persistSession: false });
    const fulfilled = await fulfillSubscription(admin, {
      buyOrder,
      session,
      authorizationCode: result.authorizationCode,
      paymentProvider: session.provider,
    });

    if (!fulfilled.ok) {
      return c.json({
        ok: false,
        authorized: true,
        error: 'Pago autorizado pero no se pudo activar la reposición. Contacta soporte con orden ' + buyOrder,
        buyOrder,
      }, 200);
    }

    return c.json({
      ok: true,
      authorized: true,
      buyOrder,
      total: session.total,
      subscriptionId: fulfilled.subscriptionId,
      alreadyProcessed: fulfilled.alreadyProcessed ?? false,
      result: result.raw,
    }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo confirmar el pago';
    return c.json({ code: 'commit_failed', message }, 500);
  }
});

/**
 * Cancela la inscripción recurrente en Flow para la suscripción activa del
 * usuario. NO toca el estado DB (eso lo hace el PATCH de tienda); solo detiene
 * los cargos automáticos. Best-effort: si Flow no expone el endpoint, devuelve
 * flowCancelled:false para que el equipo cancele manualmente en el panel.
 */
subscriptionsCheckoutRoutes.post('/cancel-inscription', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    const user = await resolveUserFromToken(token);

    if (!user) {
      return c.json({ code: 'unauthorized', message: 'Debes iniciar sesión' }, 401);
    }

    const admin = createAdminClient({ persistSession: false });
    // fromLoose: flow_inscription_buy_order aún no está en el typegen
    const { data: sub } = await fromLoose(admin, 'subscriptions')
      .select('id, flow_inscription_buy_order')
      .eq('user_id', user.id)
      .in('status', ['active', 'paused', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub || !sub.flow_inscription_buy_order) {
      return c.json({ ok: true, flowCancelled: true, alreadyInactive: true }, 200);
    }

    const provider = getPaymentProvider();
    if (typeof (provider as Partial<PaymentProviderWithRecurring>).cancelRecurring !== 'function') {
      return c.json({ ok: true, flowCancelled: false, reason: 'provider_sin_cancel' }, 200);
    }

    const cancelResult = await (provider as PaymentProviderWithRecurring).cancelRecurring(
      sub.flow_inscription_buy_order as string,
    );

    if (!cancelResult.ok) {
      console.warn('[subscriptions-checkout] cancelRecurring:', cancelResult.error);
    }

    return c.json({ ok: true, flowCancelled: cancelResult.ok });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo cancelar la inscripción';
    console.error('[subscriptions-checkout] cancel-inscription:', message);
    return c.json({ code: 'cancel_failed', message }, 500);
  }
});

/**
 * Webhook Flow para órdenes SUB-*.
 * - Sesión pending → primer pago / reactivación (fulfillSubscription).
 * - Sin sesión → cargo recurrente (mismo commerceOrder en cada mes de Flow).
 *
 * Anti-patrón (pre-pass110): short-circuit `already_processed` si existía sub
 * con metadata.buy_order. Flow reusa el commerceOrder de inscripción en cada
 * cargo → los renovaciones se tragaban como ya procesados y el período no avanzaba.
 */
export async function fulfillSubscriptionFromWebhook(
  buyOrder: string,
  authorizationCode: string,
  amount?: number,
) {
  if (!buyOrder.startsWith('SUB-')) {
    return { ok: false as const, error: 'Not a subscription order', status: 400 };
  }

  const session = await getSubscriptionCheckoutSession(buyOrder);
  if (session) {
    const admin = createAdminClient({ persistSession: false });
    const fulfilled = await fulfillSubscription(admin, {
      buyOrder,
      session,
      authorizationCode,
      paymentProvider: 'flow',
    });

    if (!fulfilled.ok) {
      return { ok: false as const, error: 'Error activando suscripción', status: 500 };
    }

    return {
      ok: true as const,
      status: fulfilled.alreadyProcessed ? ('already_processed' as const) : ('confirmed' as const),
    };
  }

  // Sin sesión pending: cargo recurrente o race post-commit del primer pago.
  // Idempotencia real = flow_order en subscription_charges (no “sub existe”).
  const flowOrder = parseFlowOrder(authorizationCode);
  if (flowOrder == null) {
    return { ok: false as const, error: 'flowOrder inválido', status: 400 };
  }

  const admin = createAdminClient({ persistSession: false });

  // Preferir clave de inscripción; fallback metadata del primer pago (legacy).
  const { data: byInscription } = await fromLoose(admin, 'subscriptions')
    .select('id')
    .eq('flow_inscription_buy_order', buyOrder)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let subscriptionId = (byInscription?.id as string | undefined) ?? null;
  if (!subscriptionId) {
    const { data: byMeta } = await admin
      .from('subscriptions')
      .select('id')
      .eq('metadata->>buy_order', buyOrder)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    subscriptionId = (byMeta?.id as string | undefined) ?? null;
  }

  if (!subscriptionId) {
    console.error(`Flow webhook: subscription session/sub not found for buyOrder ${buyOrder}`);
    return { ok: false as const, error: 'Sesión no encontrada', status: 404 };
  }

  const charged = await fulfillRecurringCharge(admin, {
    subscriptionId,
    flowOrder,
    amount: typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? amount : 0,
  });

  if (!charged.ok) {
    return {
      ok: false as const,
      error: charged.error ?? 'Error procesando cargo recurrente',
      status: 500,
    };
  }

  return {
    ok: true as const,
    status: charged.alreadyProcessed ? ('already_processed' as const) : ('confirmed' as const),
  };
}