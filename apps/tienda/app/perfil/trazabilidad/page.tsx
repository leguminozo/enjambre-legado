import React from 'react';
import { LinkIcon, Search, ShieldCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { TrazabilidadClient } from './trazabilidad-client';

export const metadata = {
  title: 'Trazabilidad Blockchain | Enjambre Legado',
};

export default async function TrazabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ lote?: string }>;
}) {
  const { lote } = await searchParams;
  const supabase = await createClient();

  let anchorData = null;
  let error = null;

  if (lote) {
    const { data, error: dbError } = await supabase
      .from('blockchain_anchors')
      .select('*')
      .eq('entity_id', lote)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError || !data) {
      error = 'No se encontró un registro criptográfico para este código.';
    } else {
      anchorData = data;
    }
  }

  return (
    <div className="space-y-12 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <LinkIcon size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">Trazabilidad</h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">
          Verifica el origen inmutable de tu miel en la Blockchain.
        </p>
      </div>

      <div className="max-w-3xl">
        <TrazabilidadClient initialLote={lote} anchor={anchorData} error={error} />
      </div>
    </div>
  );
}
