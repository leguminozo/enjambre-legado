import { createClient } from '@supabase/supabase-js';
import { getBlockchainProvider, computeDataHash } from '@/api/lib/blockchain/provider';

export async function anchorEntity(
  supabase: ReturnType<typeof createClient>,
  empresaId: string,
  entityType: 'colmena' | 'lote' | 'cosecha' | 'apiario',
  entityId: string,
  data?: Record<string, unknown>
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const provider = getBlockchainProvider();
    const dataHash = computeDataHash(entityType, entityId, data ?? {});

    const result = await provider.anchor(dataHash);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const admin = supabase as any;

    const { error: insertError } = await admin
      .from('blockchain_anchors')
      .insert({
        empresa_id: empresaId,
        entity_type: entityType,
        entity_id: entityId,
        tx_hash: result.txHash,
        chain: provider.name.toLowerCase().replace(' ', '-'),
        block_number: result.blockNumber,
        timestamp: result.blockTimestamp?.toISOString() ?? new Date().toISOString(),
        data_hash: dataHash,
      });

    if (insertError) {
      return { success: false, error: `DB insert failed: ${insertError.message}` };
    }

    const tableMap: Record<string, string> = {
      colmena: 'colmenas',
      lote: 'lotes',
      cosecha: 'cosechas',
      apiario: 'apiarios',
    };

    const table = tableMap[entityType];
    await (supabase as any)
      .from(table)
      .update({ blockchain_hash: result.txHash })
      .eq('id', entityId);

    return { success: true, txHash: result.txHash };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}