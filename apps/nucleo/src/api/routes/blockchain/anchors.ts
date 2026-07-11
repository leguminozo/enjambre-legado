import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables } from '@/api/lib/middleware';
import { createAdminClient } from '@enjambre/auth/browser';
import { requireProfileRole } from '@/api/lib/middleware';
import { getBlockchainProvider, generateMerkleProof, computeDataHash } from '@/api/lib/blockchain/provider';
import { fromLoose } from '@/api/lib/supabase-loose';

const AnchorEntitySchema = z.object({
  entity_type: z.enum(['colmena', 'lote', 'cosecha', 'apiario']),
  entity_id: z.string().uuid(),
  data: z.record(z.string(), z.unknown()).optional(),
});

const VerifyAnchorSchema = z.object({
  tx_hash: z.string(),
  chain: z.enum(['polygon-amoy', 'base-sepolia']).optional().default('polygon-amoy'),
});

export const blockchainRoutes = new Hono<{ Variables: AppVariables }>();

blockchainRoutes.post(
  '/anchor',
  requireProfileRole('admin', 'gerente'),
  zValidator('json', AnchorEntitySchema),
  async (c) => {
    try {
      const input = c.req.valid('json');
      const empresaId = c.get('empresaId');
      const supabase = c.get('supabase');

      const { entity_type, entity_id, data } = input;

      let entityData: Record<string, unknown> = data ?? {};
      let entityExists = false;

      // selects con columnas/filtros desfasados del typegen (empresa_id, blockchain_hash, etc.)
      switch (entity_type) {
        case 'colmena': {
          const { data: colmena } = await fromLoose(supabase, 'colmenas')
            .select('id, name, numero_caja, apiario_id, estado, blockchain_hash')
            .eq('id', entity_id)
            .eq('apiario_id', empresaId)
            .maybeSingle();
          if (colmena) {
            entityExists = true;
            entityData = {
              name: colmena.name,
              numero_caja: colmena.numero_caja,
              apiario_id: colmena.apiario_id,
              estado: colmena.estado,
            };
          }
          break;
        }
        case 'lote': {
          const { data: lote } = await fromLoose(supabase, 'lotes')
            .select('id, cosecha_ids, kg_total, estado, blockchain_hash')
            .eq('id', entity_id)
            .maybeSingle();
          if (lote) {
            entityExists = true;
            entityData = {
              cosecha_ids: lote.cosecha_ids,
              kg_total: lote.kg_total,
              estado: lote.estado,
            };
          }
          break;
        }
        case 'cosecha': {
          const { data: cosecha } = await fromLoose(supabase, 'cosechas')
            .select('id, lote_id, kg, fecha, estado, blockchain_hash')
            .eq('id', entity_id)
            .eq('empresa_id', empresaId)
            .maybeSingle();
          if (cosecha) {
            entityExists = true;
            entityData = {
              lote_id: cosecha.lote_id,
              kg: cosecha.kg,
              fecha: cosecha.fecha,
              estado: cosecha.estado,
            };
          }
          break;
        }
        case 'apiario': {
          const { data: apiario } = await fromLoose(supabase, 'apiarios')
            .select('id, nombre, ubicacion, blockchain_hash')
            .eq('id', entity_id)
            .eq('empresa_id', empresaId)
            .maybeSingle();
          if (apiario) {
            entityExists = true;
            entityData = { nombre: apiario.nombre, ubicacion: apiario.ubicacion };
          }
          break;
        }
      }

      if (!entityExists) {
        return c.json({ code: 'not_found', message: `${entity_type} no encontrado` }, 404);
      }

      const dataHash = computeDataHash(entity_type, entity_id, entityData);
      const provider = getBlockchainProvider();
      const result = await provider.anchor(dataHash);

      if (!result.success) {
        console.error('[Blockchain Anchor] Failed:', result.error);
        return c.json({ code: 'anchor_failed', message: result.error }, 500);
      }

      const admin = createAdminClient();
      const { error: insertError } = await admin
        .from('blockchain_anchors')
        .insert({
          empresa_id: empresaId,
          entity_type,
          entity_id,
          tx_hash: result.txHash,
          chain: provider.name.toLowerCase().replace(' ', '-'),
          block_number: result.blockNumber,
          timestamp: result.blockTimestamp?.toISOString() ?? new Date().toISOString(),
          data_hash: dataHash,
          merkle_proof: null,
        });

      if (insertError) {
        console.error('[Blockchain Anchor] DB insert failed:', insertError);
        return c.json({ code: 'db_error', message: 'Ancla registrada en cadena pero falló persistencia' }, 500);
      }

      const tableMap: Record<string, string> = {
        colmena: 'colmenas',
        lote: 'lotes',
        cosecha: 'cosechas',
        apiario: 'apiarios',
      };

      const table = tableMap[entity_type];
      if (table) {
        await fromLoose(supabase, table)
          .update({ blockchain_hash: result.txHash })
          .eq('id', entity_id);
      }

      return c.json({
        success: true,
        data: {
          entity_type,
          entity_id,
          tx_hash: result.txHash!,
          chain: provider.name,
          block_number: result.blockNumber,
          block_timestamp: result.blockTimestamp,
          explorer_url: provider.getExplorerUrl(result.txHash!),
          data_hash: dataHash,
        },
      }, 201);
    } catch (error) {
      console.error('[Blockchain Anchor] Error:', error);
      return c.json({ code: 'internal_error', message: error instanceof Error ? error.message : 'Error desconocido' }, 500);
    }
  }
);

blockchainRoutes.post(
  '/verify',
  zValidator('json', VerifyAnchorSchema),
  async (c) => {
    try {
      const { tx_hash, chain } = c.req.valid('json');
      const provider = getBlockchainProvider(chain);
      const result = await provider.verify(tx_hash);

      return c.json({
        success: true,
        data: {
          tx_hash,
          chain: provider.name,
          confirmed: result.confirmed,
          block_number: result.blockNumber,
          block_timestamp: result.blockTimestamp,
          explorer_url: provider.getExplorerUrl(tx_hash),
        },
      });
    } catch (error) {
      console.error('[Blockchain Verify] Error:', error);
      return c.json({ code: 'verify_failed', message: error instanceof Error ? error.message : 'Error verificando ancla' }, 500);
    }
  }
);

blockchainRoutes.get(
  '/anchors/:entity_type/:entity_id',
  async (c) => {
    try {
      const entity_type = c.req.param('entity_type');
      const entity_id = c.req.param('entity_id');
      const empresaId = c.get('empresaId');
      const supabase = c.get('supabase');

      const { data, error } = await supabase
        .from('blockchain_anchors')
        .select('*')
        .eq('entity_type', entity_type)
        .eq('entity_id', entity_id)
        .eq('empresa_id', empresaId)
        .order('timestamp', { ascending: false });

      if (error) {
        return c.json({ code: 'query_failed', message: error.message }, 500);
      }

      return c.json({ data: data ?? [] });
    } catch (error) {
      console.error('[Blockchain Anchors List] Error:', error);
      return c.json({ code: 'internal_error', message: error instanceof Error ? error.message : 'Error desconocido' }, 500);
    }
  }
);

export default blockchainRoutes;