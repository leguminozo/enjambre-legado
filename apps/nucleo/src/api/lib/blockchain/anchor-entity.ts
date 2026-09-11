import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@enjambre/database';
import { getBlockchainProvider, computeDataHash } from '@/api/lib/blockchain/provider';
import { revalidateTiendaLayout } from '@/lib/revalidate-tienda';

export async function anchorEntity(
  supabase: SupabaseClient<Database>,
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

    const { error: insertError } = await supabase
      .from('blockchain_anchors')
      .insert({
        empresa_id: empresaId,
        entity_type: entityType,
        entity_id: entityId,
        tx_hash: result.txHash!,
        chain: provider.name.toLowerCase().replace(' ', '-'),
        block_number: result.blockNumber,
        block_timestamp: result.blockTimestamp?.toISOString() ?? new Date().toISOString(),
        data_hash: dataHash,
      });

    if (insertError) {
      return { success: false, error: `DB insert failed: ${insertError.message}` };
    }

    switch (entityType) {
      case 'colmena':
        await supabase.from('colmenas').update({ blockchain_hash: result.txHash! }).eq('id', entityId);
        break;
      case 'lote':
        await supabase.from('lotes').update({ blockchain_hash: result.txHash! }).eq('id', entityId);
        break;
      case 'cosecha':
        await supabase.from('cosechas').update({ blockchain_hash: result.txHash! }).eq('id', entityId);
        break;
      case 'apiario':
        await supabase.from('apiarios').update({ blockchain_hash: result.txHash! }).eq('id', entityId);
        break;
    }

    if (entityType === 'lote') {
      await revalidateTiendaLayout().catch(() => undefined);
    }

    return { success: true, txHash: result.txHash! };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}