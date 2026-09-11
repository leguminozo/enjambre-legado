import type { SupabaseClient } from '@supabase/supabase-js';
import {
  computeCanonicalLoyaltyDeltas,
  type CanonicalLoyaltyChannel,
  type CanonicalLoyaltyEventType,
  type OyzCommercialRole,
} from '@enjambre/pricing';

export interface CanonicalLoyaltyRecordInput {
  idempotencyKey: string;
  userId: string;
  actorId?: string | null;
  canal: CanonicalLoyaltyChannel;
  tipoEvento: CanonicalLoyaltyEventType;
  amountClp?: number;
  userRole?: OyzCommercialRole | string;
  pointsToRedeem?: number;
  frascosCount?: number;
  referenciaTipo?: string;
  referenciaId?: string;
  metadata?: Record<string, unknown>;
}

export interface CanonicalLoyaltyResult {
  ok: boolean;
  alreadyProcessed?: boolean;
  saldoPuntos?: number;
  saldoCiclos?: number;
  tier?: string;
  deltaPuntos?: number;
  deltaCiclos?: number;
  error?: string;
}

/**
 * Registra un evento de lealtad en el libro mayor canónico e impacta los balances
 * de forma atómica e idempotente vía la función central de Postgres.
 */
export async function recordCanonicalLoyaltyEvent(
  admin: SupabaseClient,
  input: CanonicalLoyaltyRecordInput,
): Promise<CanonicalLoyaltyResult> {
  const {
    idempotencyKey,
    userId,
    actorId = null,
    canal,
    tipoEvento,
    amountClp,
    userRole,
    pointsToRedeem,
    frascosCount,
    referenciaTipo,
    referenciaId,
    metadata = {},
  } = input;

  const calculated = computeCanonicalLoyaltyDeltas({
    eventType: tipoEvento,
    amountClp,
    userRole,
    pointsToRedeem,
    frascosCount,
  });

  if (!calculated.isEligible && calculated.errorCode) {
    return {
      ok: false,
      error: calculated.errorCode,
    };
  }

  // Fallback si la migración 20260912000000 aún no está desplegada en el entorno remoto
  // para nunca bloquear un checkout o venta en caliente
  try {
    const { data, error } = await admin.rpc('registrar_evento_lealtad_canonica', {
      p_idempotency_key: idempotencyKey,
      p_user_id: userId,
      p_actor_id: actorId,
      p_canal: canal,
      p_tipo_evento: tipoEvento,
      p_delta_puntos: calculated.deltaPuntos,
      p_delta_ciclos: calculated.deltaCiclos,
      p_referencia_tipo: referenciaTipo ?? null,
      p_referencia_id: referenciaId ?? null,
      p_metadata: {
        ...metadata,
        motivo: calculated.motivo,
      },
    });

    if (error) {
      console.warn('[unified-loyalty-service] RPC error, falling back:', error.message);
      return { ok: false, error: error.message };
    }

    const parsed = data as {
      success?: boolean;
      already_processed?: boolean;
      saldo_puntos?: number;
      saldo_ciclos?: number;
      tier?: string;
      delta_puntos?: number;
      delta_ciclos?: number;
      error?: string;
    } | null;

    if (!parsed?.success) {
      return { ok: false, error: parsed?.error ?? 'rpc_call_failed' };
    }

    return {
      ok: true,
      alreadyProcessed: parsed.already_processed,
      saldoPuntos: parsed.saldo_puntos,
      saldoCiclos: parsed.saldo_ciclos,
      tier: parsed.tier,
      deltaPuntos: parsed.delta_puntos,
      deltaCiclos: parsed.delta_ciclos,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[unified-loyalty-service] unexpected error:', msg);
    return { ok: false, error: msg };
  }
}

/**
 * Canje de puntos en Checkout Web (idempotente y blindado ante concurrencia)
 */
export async function applyCanonicalCheckoutRedeem(
  admin: SupabaseClient,
  input: {
    buyOrder: string;
    userId: string;
    pointsRedeemed: number;
    userRole?: string;
  },
): Promise<CanonicalLoyaltyResult> {
  const { buyOrder, userId, pointsRedeemed, userRole } = input;
  if (pointsRedeemed <= 0) {
    return { ok: true, alreadyProcessed: true };
  }

  return recordCanonicalLoyaltyEvent(admin, {
    idempotencyKey: `redeem:${buyOrder}`,
    userId,
    canal: 'web',
    tipoEvento: 'canje_checkout',
    pointsToRedeem: pointsRedeemed,
    userRole,
    referenciaTipo: 'ventas_checkout_redeem',
    referenciaId: buyOrder,
  });
}

/**
 * Acreditación de compra completada (puntos + ciclos en una sola transacción)
 */
export async function applyCanonicalPurchaseEarn(
  admin: SupabaseClient,
  input: {
    buyOrder: string;
    ventaId: string;
    userId: string;
    paidTotalClp: number;
    canal?: CanonicalLoyaltyChannel;
    userRole?: string;
  },
): Promise<CanonicalLoyaltyResult> {
  const { buyOrder, ventaId, userId, paidTotalClp, canal = 'web', userRole } = input;
  if (paidTotalClp <= 0) {
    return { ok: true, alreadyProcessed: true };
  }

  return recordCanonicalLoyaltyEvent(admin, {
    idempotencyKey: `earn:${ventaId || buyOrder}`,
    userId,
    canal,
    tipoEvento: 'compra_completada',
    amountClp: paidTotalClp,
    userRole,
    referenciaTipo: 'ventas',
    referenciaId: ventaId,
    metadata: { buyOrder },
  });
}
