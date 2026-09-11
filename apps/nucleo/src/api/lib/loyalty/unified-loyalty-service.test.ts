import { describe, expect, it, vi } from 'vitest';
import { recordCanonicalLoyaltyEvent } from './unified-loyalty-service';

function buildMockAdmin(rpcResponse: { data?: unknown; error?: { message: string } | null }) {
  return {
    rpc: vi.fn().mockResolvedValue(rpcResponse),
  };
}

describe('unified-loyalty-service', () => {
  it('calls registrar_evento_lealtad_canonica with calculated deltas', async () => {
    const admin = buildMockAdmin({
      data: {
        success: true,
        saldo_puntos: 350,
        saldo_ciclos: 35,
        tier: 'OBRERA',
        delta_puntos: 250,
        delta_ciclos: 25,
      },
      error: null,
    });

    const result = await recordCanonicalLoyaltyEvent(admin as never, {
      idempotencyKey: 'earn:ORD-999',
      userId: 'user-abc',
      canal: 'web',
      tipoEvento: 'compra_completada',
      amountClp: 25000,
      userRole: 'comprador',
    });

    expect(result.ok).toBe(true);
    expect(result.saldoPuntos).toBe(350);
    expect(result.saldoCiclos).toBe(35);
    expect(admin.rpc).toHaveBeenCalledWith('registrar_evento_lealtad_canonica', {
      p_idempotency_key: 'earn:ORD-999',
      p_user_id: 'user-abc',
      p_actor_id: null,
      p_canal: 'web',
      p_tipo_evento: 'compra_completada',
      p_delta_puntos: 250,
      p_delta_ciclos: 25,
      p_referencia_tipo: null,
      p_referencia_id: null,
      p_metadata: expect.objectContaining({ motivo: 'Compra completada' }),
    });
  });

  it('rejects point redemptions for ineligible wholesale roles', async () => {
    const admin = buildMockAdmin({ data: null });

    const result = await recordCanonicalLoyaltyEvent(admin as never, {
      idempotencyKey: 'redeem:ORD-B2B',
      userId: 'user-b2b',
      canal: 'web',
      tipoEvento: 'canje_checkout',
      pointsToRedeem: 200,
      userRole: 'revendedor',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('role_not_eligible');
    expect(admin.rpc).not.toHaveBeenCalled();
  });
});
