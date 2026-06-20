import type { SupabaseClient } from '@supabase/supabase-js';
import {
  processGastoExtranjero as processGastoCore,
  type ProcessGastoInput,
  type ProcessGastoResult,
} from '@enjambre/fiscal';
import { createFacturaCompraFromGasto } from '@/api/routes/sii/helpers';
import { emitFacturaCompraToSii } from './emit-factura-compra';
import { syncRcvPeriod } from './rcv-sync';

export type { ProcessGastoInput, ProcessGastoResult } from '@enjambre/fiscal';

export async function processGastoExtranjero(
  supabase: SupabaseClient,
  empresaId: string,
  input: ProcessGastoInput,
): Promise<ProcessGastoResult> {
  return processGastoCore(supabase, empresaId, input, {
    createFacturaCompra: async (eid, gasto) => {
      const { data } = await createFacturaCompraFromGasto(eid, supabase, gasto);
      return { id: (data as { id: string }).id };
    },
    emitFacturaCompra: async (eid, facturaId) => {
      const result = await emitFacturaCompraToSii(supabase, eid, facturaId);
      if (!result.ok) return result;
      return {
        ok: true as const,
        trackId: result.trackId,
        estadoSii: result.estadoSii,
      };
    },
    syncRcv: (eid, periodo, tipo) => syncRcvPeriod(supabase, eid, periodo, tipo),
  });
}