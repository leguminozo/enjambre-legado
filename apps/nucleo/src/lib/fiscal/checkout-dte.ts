import type { SupabaseClient } from '@supabase/supabase-js';
import type { CartLineInput } from '@/api/lib/payments/types';
import { emitBoletaVentaToSii } from '@/api/lib/fiscal/emit-boleta-venta';
import { periodoFromFecha, syncRcvPeriod } from '@/api/lib/fiscal/rcv-sync';

export function isAutoEmitBoletaEnabled(): boolean {
  return process.env.SII_AUTO_EMIT_BOLETA === 'true';
}

export type CheckoutDteInput = {
  empresaId: string;
  facturaEmitidaId: string;
  ventaId: string;
  buyOrder: string;
  receptorNombre: string;
  cart: CartLineInput[];
  fechaEmision: string;
};

export type CheckoutDteResult =
  | { skipped: true; reason: string }
  | { skipped: false; ok: true; folio: number; trackId: string; estadoSii: string; rcv?: { periodo: string } }
  | { skipped: false; ok: false; code: string; message: string };

export async function maybeEmitBoletaPostCheckout(
  admin: SupabaseClient,
  input: CheckoutDteInput,
): Promise<CheckoutDteResult> {
  if (!isAutoEmitBoletaEnabled()) {
    return { skipped: true, reason: 'SII_AUTO_EMIT_BOLETA disabled' };
  }

  try {
    const detalleLineas = input.cart.map((line) => ({
      nombre: line.name,
      cantidad: line.quantity,
      precioUnitario: Math.round(line.unitPrice),
    }));

    const emission = await emitBoletaVentaToSii(admin, input.empresaId, {
      facturaEmitidaId: input.facturaEmitidaId,
      ventaId: input.ventaId,
      receptorNombre: input.receptorNombre,
      detalleLineas,
    });

    if (!emission.ok) {
      console.error('[checkout-dte] boleta emission failed:', emission.code, emission.message, {
        buyOrder: input.buyOrder,
        ventaId: input.ventaId,
      });
      return { skipped: false, ok: false, code: emission.code, message: emission.message };
    }

    let rcv: { periodo: string } | undefined;
    if (emission.estadoSii === 'aceptado') {
      try {
        const periodo = periodoFromFecha(input.fechaEmision);
        const synced = await syncRcvPeriod(admin, input.empresaId, periodo, 'ventas');
        if (synced.ok) rcv = { periodo };
      } catch (err) {
        console.error('[checkout-dte] RCV ventas sync failed:', err);
      }
    }

    return {
      skipped: false,
      ok: true,
      folio: emission.folio,
      trackId: emission.trackId,
      estadoSii: emission.estadoSii,
      rcv,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[checkout-dte] unexpected error:', message, { buyOrder: input.buyOrder });
    return { skipped: false, ok: false, code: 'checkout_dte_failed', message };
  }
}