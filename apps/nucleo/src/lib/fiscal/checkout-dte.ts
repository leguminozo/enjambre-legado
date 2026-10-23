import type { SupabaseClient } from '@supabase/supabase-js';
import { enqueueSiiDocumentJob } from '@enjambre/fiscal';
import { DTE_TIPO } from '@enjambre/contable';
import type { CartLineInput } from '@/api/lib/payments/types';
import { emitBoletaVentaToSii } from '@/api/lib/fiscal/emit-boleta-venta';
import { emitFacturaDteFromRow } from '@/api/lib/fiscal/emit-factura-dte-from-row';
import { periodoFromFecha, syncRcvPeriod } from '@/api/lib/fiscal/rcv-sync';

function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === 'production' ||
    (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview')
  );
}

let warnedProductionAutoEmit = false;

export function isAutoEmitBoletaEnabled(): boolean {
  const explicit = process.env.SII_AUTO_EMIT_BOLETA === 'true';
  if (explicit) return true;
  if (!isProductionRuntime()) return false;
  // En producción la boleta es obligatoria: el flag apagado no puede
  // convertir el checkout en una venta sin documento tributario.
  if (!warnedProductionAutoEmit) {
    warnedProductionAutoEmit = true;
    console.error(
      '[checkout-dte] SII_AUTO_EMIT_BOLETA no está en "true" en producción; se fuerza la emisión.',
    );
  }
  return true;
}

export function isAutoEmitFacturaEnabled(): boolean {
  return process.env.SII_AUTO_EMIT_FACTURA === 'true' || isAutoEmitBoletaEnabled();
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

export type CheckoutFacturaInput = {
  empresaId: string;
  facturaEmitidaId: string;
  ventaId: string;
  buyOrder: string;
  terceroRut: string;
  terceroNombre: string;
  terceroGiro?: string | null;
  terceroDireccion?: string | null;
  cart: CartLineInput[];
  fechaEmision: string;
};

export type CheckoutDteResult =
  | { skipped: true; reason: string }
  | {
      skipped: false;
      ok: true;
      folio: number;
      trackId: string;
      estadoSii: string;
      rcv?: { periodo: string };
      retriedViaJob?: boolean;
    }
  | {
      skipped: false;
      ok: false;
      code: string;
      message: string;
      /** Job encolado para reintento async (cron fiscal) */
      jobId?: string;
    };

export async function maybeEmitBoletaPostCheckout(
  admin: SupabaseClient,
  input: CheckoutDteInput,
): Promise<CheckoutDteResult> {
  if (!isAutoEmitBoletaEnabled()) {
    return { skipped: true, reason: 'SII_AUTO_EMIT_BOLETA disabled' };
  }

  const detalleLineas = input.cart.map((line) => ({
    nombre: line.name,
    cantidad: line.quantity,
    precioUnitario: Math.round(line.unitPrice),
  }));

  try {
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

      // Reintento async con backoff (cron /api/cron/fiscal)
      const enqueued = await enqueueSiiDocumentJob(admin, {
        empresaId: input.empresaId,
        sourceType: 'venta',
        sourceId: input.ventaId,
        tipoDte: DTE_TIPO.BOLETA_ELECTRONICA,
        idempotencyKey: `boleta_checkout:${input.facturaEmitidaId}`,
        payload: {
          facturaEmitidaId: input.facturaEmitidaId,
          ventaId: input.ventaId,
          receptorNombre: input.receptorNombre,
          detalleLineas,
          buyOrder: input.buyOrder,
        },
        // primer reintento a ~2 min
        scheduledAt: new Date(Date.now() + 2 * 60_000),
      });

      return {
        skipped: false,
        ok: false,
        code: emission.code,
        message: emission.message,
        jobId: enqueued.ok ? enqueued.id : undefined,
      };
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

    const enqueued = await enqueueSiiDocumentJob(admin, {
      empresaId: input.empresaId,
      sourceType: 'venta',
      sourceId: input.ventaId,
      tipoDte: DTE_TIPO.BOLETA_ELECTRONICA,
      idempotencyKey: `boleta_checkout:${input.facturaEmitidaId}`,
      payload: {
        facturaEmitidaId: input.facturaEmitidaId,
        ventaId: input.ventaId,
        receptorNombre: input.receptorNombre,
        detalleLineas,
        buyOrder: input.buyOrder,
      },
      scheduledAt: new Date(Date.now() + 2 * 60_000),
    }).catch(() => ({ ok: false as const, error: 'enqueue_failed' }));

    return {
      skipped: false,
      ok: false,
      code: 'checkout_dte_failed',
      message,
      jobId: enqueued.ok ? enqueued.id : undefined,
    };
  }
}

export async function maybeEmitFacturaPostCheckout(
  admin: SupabaseClient,
  input: CheckoutFacturaInput,
): Promise<CheckoutDteResult> {
  if (!isAutoEmitFacturaEnabled()) {
    return { skipped: true, reason: 'SII_AUTO_EMIT_FACTURA disabled' };
  }

  try {
    const emission = await emitFacturaDteFromRow(
      admin,
      input.empresaId,
      input.facturaEmitidaId,
      DTE_TIPO.FACTURA_ELECTRONICA,
    );

    if (!emission.ok) {
      console.error('[checkout-dte] factura emission failed:', emission.code, emission.message, {
        buyOrder: input.buyOrder,
        ventaId: input.ventaId,
      });

      const enqueued = await enqueueSiiDocumentJob(admin, {
        empresaId: input.empresaId,
        sourceType: 'venta',
        sourceId: input.ventaId,
        tipoDte: DTE_TIPO.FACTURA_ELECTRONICA,
        idempotencyKey: `factura_checkout:${input.facturaEmitidaId}`,
        payload: {
          facturaEmitidaId: input.facturaEmitidaId,
          ventaId: input.ventaId,
          buyOrder: input.buyOrder,
          terceroRut: input.terceroRut,
        },
        scheduledAt: new Date(Date.now() + 2 * 60_000),
      });

      return {
        skipped: false,
        ok: false,
        code: emission.code,
        message: emission.message ?? 'Error emitiendo factura electrónica',
        jobId: enqueued.ok ? enqueued.id : undefined,
      };
    }

    const { data: updatedFactura } = await admin
      .from('facturas_emitidas')
      .select('folio, track_id, estado_sii')
      .eq('id', input.facturaEmitidaId)
      .single();

    let rcv: { periodo: string } | undefined;
    if (updatedFactura?.estado_sii === 'aceptado') {
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
      folio: updatedFactura?.folio ?? 0,
      trackId: updatedFactura?.track_id ?? '',
      estadoSii: updatedFactura?.estado_sii ?? 'enviado',
      rcv,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[checkout-dte] unexpected factura error:', message, { buyOrder: input.buyOrder });

    const enqueued = await enqueueSiiDocumentJob(admin, {
      empresaId: input.empresaId,
      sourceType: 'venta',
      sourceId: input.ventaId,
      tipoDte: DTE_TIPO.FACTURA_ELECTRONICA,
      idempotencyKey: `factura_checkout:${input.facturaEmitidaId}`,
      payload: {
        facturaEmitidaId: input.facturaEmitidaId,
        ventaId: input.ventaId,
        buyOrder: input.buyOrder,
      },
      scheduledAt: new Date(Date.now() + 2 * 60_000),
    }).catch(() => ({ ok: false as const, error: 'enqueue_failed' }));

    return {
      skipped: false,
      ok: false,
      code: 'checkout_factura_failed',
      message,
      jobId: enqueued.ok ? enqueued.id : undefined,
    };
  }
}
