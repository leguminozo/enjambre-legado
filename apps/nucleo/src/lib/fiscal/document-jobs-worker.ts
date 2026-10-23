import { createAdminClient } from '@enjambre/auth/server-index';
import { processSiiDocumentJobs } from '@enjambre/fiscal';
import { emitFacturaCompraToSii } from '@/api/lib/fiscal/emit-factura-compra';
import { emitBoletaVentaToSii } from '@/api/lib/fiscal/emit-boleta-venta';
import { emitFacturaDteFromRow } from '@/api/lib/fiscal/emit-factura-dte-from-row';
import { DTE_TIPO } from '@enjambre/contable';
import { notifyDteReadyForVenta } from '@/lib/notifications/enqueue-transactional';

export async function processFiscalDocumentJobs() {
  const supabase = createAdminClient();

  return processSiiDocumentJobs(supabase, {
    emitFacturaCompra: async (empresaId, facturaId) => {
      const result = await emitFacturaCompraToSii(supabase, empresaId, facturaId);
      if (!result.ok) {
        return { ok: false as const, code: result.code, message: result.message };
      }
      return {
        ok: true as const,
        trackId: result.trackId,
        estadoSii: result.estadoSii,
      };
    },
    emitBoletaVenta: async (empresaId, input) => {
      const result = await emitBoletaVentaToSii(supabase, empresaId, input);
      if (!result.ok) {
        return { ok: false as const, code: result.code, message: result.message };
      }
      return {
        ok: true as const,
        trackId: result.trackId,
        estadoSii: result.estadoSii,
        folio: result.folio,
      };
    },
    emitFacturaVenta: async (empresaId, input) => {
      const result = await emitFacturaDteFromRow(
        supabase,
        empresaId,
        input.facturaEmitidaId,
        DTE_TIPO.FACTURA_ELECTRONICA,
      );
      if (!result.ok) {
        return { ok: false as const, code: result.code, message: result.message };
      }
      return {
        ok: true as const,
        trackId: result.trackId,
        estadoSii: result.estadoSii,
        folio: result.folio,
      };
    },
    onVentaEmitted: async ({ empresaId, ventaId, facturaEmitidaId, folio }) => {
      await notifyDteReadyForVenta(supabase, {
        ventaId,
        facturaEmitidaId,
        folio,
        empresaId,
      });
    },
  });
}