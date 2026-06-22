import type { SupabaseClient } from '@supabase/supabase-js';

type LoyaltyFulfillInput = {
  buyOrder: string;
  ventaId: string;
  userId: string;
  empresaId: string;
  paidTotalClp: number;
  pointsRedeemed: number;
};

export async function applyCheckoutLoyalty(
  admin: SupabaseClient,
  input: LoyaltyFulfillInput,
): Promise<{ ok: boolean; error?: string }> {
  const { buyOrder, ventaId, userId, empresaId, paidTotalClp, pointsRedeemed } = input;

  if (pointsRedeemed > 0) {
    const { data: redeemResult, error: redeemError } = await admin.rpc('canjear_puntos_checkout', {
      p_user_id: userId,
      p_empresa_id: empresaId,
      p_puntos: pointsRedeemed,
      p_buy_order: buyOrder,
      p_venta_id: ventaId,
    });

    if (redeemError) {
      console.error('[loyalty-fulfill] canjear_puntos_checkout error:', redeemError.message);
      return { ok: false, error: redeemError.message };
    }

    const parsed = redeemResult as { success?: boolean; error?: string } | null;
    if (parsed && parsed.success === false) {
      console.error('[loyalty-fulfill] redeem rejected:', parsed.error);
      return { ok: false, error: parsed.error ?? 'redeem_failed' };
    }
  }

  const { data: existingEarn } = await admin
    .from('puntos_transacciones')
    .select('id')
    .eq('venta_id', ventaId)
    .eq('tipo', 'ganado')
    .maybeSingle();

  if (!existingEarn) {
    const { data: puntosGanados, error: calcError } = await admin.rpc('calcular_puntos_compra', {
      p_user_id: userId,
      p_empresa_id: empresaId,
      p_monto_compra: paidTotalClp,
    });

    if (calcError) {
      console.error('[loyalty-fulfill] calcular_puntos_compra error:', calcError.message);
    } else if (typeof puntosGanados === 'number' && puntosGanados > 0) {
      const { error: earnError } = await admin.rpc('agregar_puntos_usuario', {
        p_user_id: userId,
        p_empresa_id: empresaId,
        p_puntos: puntosGanados,
        p_venta_id: ventaId,
        p_motivo: 'Compra web',
        p_metadata: { buy_order: buyOrder, channel: 'web' },
      });
      if (earnError) {
        console.error('[loyalty-fulfill] agregar_puntos_usuario error:', earnError.message);
      }
    }
  }

  const ciclosGanados = Math.floor(paidTotalClp / 1000);
  if (ciclosGanados > 0) {
    const { data: existingCiclo } = await admin
      .from('ciclos')
      .select('id')
      .eq('referencia_tabla', 'ventas')
      .eq('referencia_id', ventaId)
      .maybeSingle();

    if (!existingCiclo) {
      const { error: cicloError } = await admin.from('ciclos').insert({
        user_id: userId,
        cantidad: ciclosGanados,
        tipo: 'compra',
        referencia_id: ventaId,
        referencia_tabla: 'ventas',
      });
      if (cicloError) {
        console.error('[loyalty-fulfill] ciclos insert error:', cicloError.message);
      }
    }
  }

  return { ok: true };
}