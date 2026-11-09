import type { SupabaseClient } from '@supabase/supabase-js';
import { fulfillCheckout, type FulfillCheckoutResult } from './checkout-fulfill';
import {
  completeCheckoutSession,
  getCheckoutSessionByBuyOrder,
  type CheckoutSession,
} from './types';

export interface SettleCheckoutInput {
  buyOrder: string;
  authorizationCode: string;
  paymentProvider?: string;
  session?: CheckoutSession;
  forceClaim?: boolean;
  allowForceStock?: boolean;
}

export interface SettleCheckoutResult extends FulfillCheckoutResult {
  /** Otro proceso tiene el claim; el webhook terminará la liquidación. */
  processing?: boolean;
  /** No hay sesión ni venta para esta orden. */
  notFound?: boolean;
}

const CLAIM_STALE_MS = 2 * 60_000;
const WAIT_ATTEMPTS = 5;
const WAIT_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findVentaId(admin: SupabaseClient, buyOrder: string): Promise<string | undefined> {
  const { data } = await admin
    .from('ventas')
    .select('id')
    .eq('buy_order', buyOrder)
    .maybeSingle();
  return (data?.id as string | undefined) ?? undefined;
}

async function healAlreadyProcessed(admin: SupabaseClient, buyOrder: string): Promise<void> {
  try {
    await admin.rpc('release_checkout_stock', { p_buy_order: buyOrder });
  } catch (err) {
    console.warn('[settle-checkout] release holds on alreadyProcessed:', err);
  }
  try {
    await completeCheckoutSession(buyOrder, admin);
  } catch (err) {
    console.warn('[settle-checkout] complete session on alreadyProcessed:', err);
  }
}

async function claimFulfillment(admin: SupabaseClient, buyOrder: string, force = false): Promise<boolean> {
  const staleBefore = new Date(Date.now() - CLAIM_STALE_MS).toISOString();
  let query = admin
    .from('checkout_sessions')
    .update({ fulfillment_started_at: new Date().toISOString() })
    .eq('buy_order', buyOrder);

  if (!force) {
    query = query.or(`fulfillment_started_at.is.null,fulfillment_started_at.lt.${staleBefore}`);
  }

  const { data, error } = await query
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo reclamar la liquidación: ${error.message}`);
  }
  return Boolean(data);
}

async function releaseFulfillmentClaim(admin: SupabaseClient, buyOrder: string): Promise<void> {
  const { error } = await admin
    .from('checkout_sessions')
    .update({ fulfillment_started_at: null })
    .eq('buy_order', buyOrder);
  if (error) {
    console.warn('[settle-checkout] release claim failed:', error.message);
  }
}

async function waitForVenta(admin: SupabaseClient, buyOrder: string): Promise<string | undefined> {
  for (let attempt = 0; attempt < WAIT_ATTEMPTS; attempt += 1) {
    const ventaId = await findVentaId(admin, buyOrder);
    if (ventaId) return ventaId;
    await sleep(WAIT_MS);
  }
  return undefined;
}

/**
 * Único punto de liquidación post-pago.
 *
 * - Serializa webhook, commit y retry admin con un claim en checkout_sessions.
 * - Si la venta ya existe, responde éxito idempotente sin repetir stock/DTE.
 * - Acepta sesiones expired/completed: un pago autorizado no se pierde por TTL.
 */
export async function settleCheckout(
  admin: SupabaseClient,
  input: SettleCheckoutInput,
): Promise<SettleCheckoutResult> {
  const { buyOrder, authorizationCode } = input;

  const existingVentaId = await findVentaId(admin, buyOrder);
  if (existingVentaId) {
    await healAlreadyProcessed(admin, buyOrder);
    return { ok: true, ventaId: existingVentaId, alreadyProcessed: true };
  }

  const session = input.session ?? (await getCheckoutSessionByBuyOrder(buyOrder));
  if (!session) {
    const lateVentaId = await findVentaId(admin, buyOrder);
    if (lateVentaId) {
      await healAlreadyProcessed(admin, buyOrder);
      return { ok: true, ventaId: lateVentaId, alreadyProcessed: true };
    }
    return { ok: false, notFound: true };
  }

  let claimed: boolean;
  try {
    claimed = await claimFulfillment(admin, buyOrder, input.forceClaim);
  } catch (err) {
    console.error('[settle-checkout] claim failed:', err);
    const lateVentaId = await findVentaId(admin, buyOrder);
    if (lateVentaId) {
      return { ok: true, ventaId: lateVentaId, alreadyProcessed: true };
    }
    return { ok: false, processing: true };
  }

  if (!claimed) {
    const ventaId = await waitForVenta(admin, buyOrder);
    if (ventaId) {
      return { ok: true, ventaId, alreadyProcessed: true };
    }
    return { ok: false, processing: true };
  }

  try {
    const result = await fulfillCheckout(admin, {
      buyOrder,
      session,
      authorizationCode,
      paymentProvider: input.paymentProvider ?? session.provider,
      allowForceStock: input.allowForceStock,
    });
    if (result.ok && result.alreadyProcessed) {
      await healAlreadyProcessed(admin, buyOrder);
    }
    if (!result.ok) {
      await releaseFulfillmentClaim(admin, buyOrder);
    }
    return result;
  } catch (err) {
    await releaseFulfillmentClaim(admin, buyOrder);
    throw err;
  }
}
