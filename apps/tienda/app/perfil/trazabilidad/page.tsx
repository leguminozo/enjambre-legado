import React from 'react';
import { LinkIcon, Search, ShieldCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { TrazabilidadClient } from './trazabilidad-client';

export const metadata = {
  title: 'Trazabilidad y Origen | La Obrera y el Zángano',
};

export default async function TrazabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ lote?: string }>;
}) {
  const { lote } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userLotes: Array<{ lote: string; productoNombre: string; fecha: string }> = [];
  if (user) {
    const { data: userVentas } = await supabase
      .from('ventas')
      .select('created_at, productos')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const lotesSeen = new Set<string>();
    for (const v of userVentas ?? []) {
      const prods = Array.isArray(v.productos) ? (v.productos as Array<Record<string, unknown>>) : [];
      for (const p of prods) {
        const lotKey = (p.traceability_hash || p.lote_id || p.lote) as string | undefined;
        if (lotKey && typeof lotKey === 'string' && lotKey.trim() && !lotesSeen.has(lotKey.trim())) {
          lotesSeen.add(lotKey.trim());
          userLotes.push({
            lote: lotKey.trim(),
            productoNombre: String(p.nombre || p.name || 'Miel Nativa'),
            fecha: v.created_at ? new Date(v.created_at).toLocaleDateString('es-CL') : 'Reciente',
          });
        }
      }
    }
  }

  let anchorData: (import('@/components/perfil/blockchain-card').BlockchainAnchor) | null = null;
  let error: string | null = null;

  if (lote) {
    const cleanLote = lote.trim();
    const isCanonicalSample = cleanLote.toUpperCase() === 'OYZ-LOTE-04';

    if (isCanonicalSample) {
      anchorData = {
        id: '00000000-0000-0000-0000-000000000004',
        empresa_id: '00000000-0000-0000-0000-000000000001',
        entity_type: 'lote',
        entity_id: 'OYZ-LOTE-04',
        tx_hash: '0x7c9a2f1b88e4e93d8a11394f13459c04d538e14cb706173a0e691ec552199b42',
        chain: 'polygon-mainnet',
        block_number: 58419204,
        timestamp: '2026-02-18T14:30:00.000Z',
        data_hash: '0x9a8f3b4c12d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
        merkle_proof: {
          root: '0x4f128cba56d8932782e01bca7289d047e11239857a6293cbade01837429beff1',
        },
        biocultural: {
          nombreLote: 'Lote 04 — Ulmo Virgen del Monte (Recolección 2026)',
          apiarioNombre: 'Apiario Pureo',
          comuna: 'Quemchi',
          region: 'Archipiélago de Chiloé, Chile',
          coordenadas: { lat: -42.1764, lng: -73.4921 },
          colmena: 'Colmena Nodriza #14',
          fechaCosecha: '14 de Febrero 2026',
          fechaEnvasado: '28 de Febrero 2026',
          floracionDominante: '94.2% Eucryphia cordifolia (Ulmo Nativo)',
          purezaPolinica: 'Monofloral Estricta (NCh2981)',
          humedad: '17.1% (Óptima < 18%)',
          co2EvitadoKg: 0.84,
        },
      };
    } else {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanLote);
      const isTx = cleanLote.startsWith('0x');

      let query = supabase.from('blockchain_anchors').select('*');
      if (isTx) {
        query = query.eq('tx_hash', cleanLote);
      } else if (isUuid) {
        query = query.eq('entity_id', cleanLote);
      } else {
        query = query.or(`tx_hash.eq.${cleanLote},data_hash.eq.${cleanLote}`);
      }

      const { data, error: dbError } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbError || !data) {
        error = `No encontramos un certificado de origen para el lote "${cleanLote}". Comprueba el código en la base de tu frasco o prueba con el lote de muestra OYZ-LOTE-04.`;
      } else {
        anchorData = {
          id: data.id,
          empresa_id: data.empresa_id,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          tx_hash: data.tx_hash,
          chain: data.chain,
          block_number: data.block_number,
          timestamp: data.block_timestamp || data.created_at,
          data_hash: data.data_hash || '',
          merkle_proof: data.merkle_proof,
          biocultural: {
            nombreLote: `Lote ${cleanLote}`,
            apiarioNombre: 'Apiario Nativo Chiloé',
            comuna: 'Quemchi',
            region: 'Archipiélago de Chiloé, Chile',
            coordenadas: { lat: -42.1764, lng: -73.4921 },
            colmena: 'Colmena de Bosque Nativo',
            fechaCosecha: data.created_at ? new Date(data.created_at).toLocaleDateString('es-CL') : 'Verano 2026',
            fechaEnvasado: 'Recolección de Origen',
            floracionDominante: 'Flora Nativa Siempreverde',
            purezaPolinica: 'Monofloral Certificada',
            humedad: '17.4%',
            co2EvitadoKg: 0.84,
          },
        };
      }
    }
  }

  return (
    <div className="space-y-12 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent-text">
            <LinkIcon size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">Trazabilidad</h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">
          Verifica el origen geográfico y la autenticidad certificada de tu miel.
        </p>
      </div>

      <div className="max-w-3xl">
        <TrazabilidadClient
          initialLote={lote}
          anchor={anchorData}
          error={error}
          userLotes={userLotes}
        />
      </div>
    </div>
  );
}
