import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { getPaymentProvider } from '../lib/payments';
import {
  saveSubscriptionCheckoutSession,
  getSubscriptionCheckoutSession,
} from '../lib/payments/subscription-sessions';
import { fulfillSubscription } from '../lib/payments/subscription-fulfill';
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '../lib/ratelimit';

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
});

const CommitBodySchema = z.object({
  token_ws: z.string().min(1),
  buyOrder: z.string().min(1).optional(),
  provider: z.enum(['transbank', 'flow']).optional(),
});

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials for admin client');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function resolveUserFromToken(token: string | null) {
  if (!token) return null;
  const admin = createAdminClient();
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

    const { planId, returnUrl: rawReturnUrl } = c.req.valid('json');
    const admin = createAdminClient();

    const { data: plan, error: planError } = await admin
      .from('subscription_plans')
      .select('id, name, price_clp, active')
      .eq('id', planId)
      .single();

    if (planError || !plan || !plan.active) {
      return c.json({ code: 'plan_not_found', message: 'Plan no encontrado' }, 404);
    }

    const { data: activeSub } = await admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'paused'])
      .limit(1)
      .maybeSingle();

    if (activeSub) {
      return c.json({ code: 'already_subscribed', message: 'Ya tienes un ritual activo' }, 409);
    }

    const total = Math.max(1, Math.round(plan.price_clp));
    const buyOrder = `SUB-${crypto.randomUUID()}`;
    const sessionId = `sub-sess-${crypto.randomUUID()}`;

    const baseReturnUrl =
      rawReturnUrl ||
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/perfil/ritual/resultado`;
    const returnUrl = `${baseReturnUrl}?buyOrder=${encodeURIComponent(buyOrder)}`;

    const provider = getPaymentProvider();
    const result = await provider.init(
      buyOrder,
      sessionId,
      total,
      returnUrl,
      user.email,
    );

    await saveSubscriptionCheckoutSession({
      buyOrder,
      sessionId,
      provider: provider.name,
      userId: user.id,
      planId: plan.id,
      total,
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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar el pago del ritual';
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

    const buyOrder = clientBuyOrder || result.buyOrder;
    if (!buyOrder?.startsWith('SUB-')) {
      return c.json({ ok: false, authorized: true, error: 'Orden de suscripción inválida', buyOrder }, 200);
    }

    const session = buyOrder ? await getSubscriptionCheckoutSession(buyOrder) : undefined;

    if (!session) {
      console.error(`Subscription session not found for buyOrder: ${buyOrder}`);
      return c.json({
        ok: false,
        authorized: true,
        error: 'Sesión de pago expirada. Contacta soporte con orden ' + buyOrder,
        buyOrder,
      }, 200);
    }

    const admin = createAdminClient();
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
        error: 'Pago autorizado pero no se pudo activar el ritual. Contacta soporte con orden ' + buyOrder,
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

export async function fulfillSubscriptionFromWebhook(
  buyOrder: string,
  authorizationCode: string,
) {
  if (!buyOrder.startsWith('SUB-')) {
    return { ok: false as const, error: 'Not a subscription order', status: 400 };
  }

  const session = await getSubscriptionCheckoutSession(buyOrder);
  if (!session) {
    console.error(`Flow webhook: subscription session not found for buyOrder ${buyOrder}`);
    return { ok: false as const, error: 'Sesión no encontrada', status: 404 };
  }

  const admin = createAdminClient();
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