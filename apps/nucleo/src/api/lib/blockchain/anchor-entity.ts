import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@enjambre/database';
import { fromLoose } from '@/api/lib/supabase-loose';
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

    const { error: insertError } = await fromLoose(supabase, 'blockchain_anchors')
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
        await fromLoose(supabase, 'colmenas').update({ blockchain_hash: result.txHash! }).eq('id', entityId);
        break;
      case 'lote':
        await fromLoose(supabase, 'lotes').update({ blockchain_hash: result.txHash! }).eq('id', entityId);
        break;
      case 'cosecha':
        await fromLoose(supabase, 'cosechas').update({ blockchain_hash: result.txHash! }).eq('id', entityId);
        break;
      case 'apiario':
        await fromLoose(supabase, 'apiarios').update({ blockchain_hash: result.txHash! }).eq('id', entityId);
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