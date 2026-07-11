import { createAdminClient } from '@enjambre/auth/browser';
import { processSiiDocumentJobs } from '@enjambre/fiscal';
import { emitFacturaCompraToSii } from '@/api/lib/fiscal/emit-factura-compra';
import { emitBoletaVentaToSii } from '@/api/lib/fiscal/emit-boleta-venta';

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
  });
}