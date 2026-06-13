import { createAnonServerClient } from '@/utils/supabase/anon-server';

export interface EcosystemMetrics {
  arboles_total: number;
  co2_ton: number;
  especies_nativas: number;
  sectores: number;
  colmenas_total: number;
  apiarios_total: number;
  irr_ecosistema: number | null;
  co2_capturado_kg: number;
  co2_emitido_kg: number;
  productos_activos: number;
  azucar_sustituida_g: number;
  co2_evitado_total_kg: number;
  anos_legado: string;
}

export async function getEcosystemMetrics(): Promise<EcosystemMetrics> {
  const supabase = createAnonServerClient();
  const { data, error } = await supabase.rpc('get_ecosystem_metrics');

  if (error || !data) {
    return {
      arboles_total: 0,
      co2_ton: 0,
      especies_nativas: 0,
      sectores: 0,
      colmenas_total: 0,
      apiarios_total: 0,
      irr_ecosistema: null,
      co2_capturado_kg: 0,
      co2_emitido_kg: 0,
      productos_activos: 0,
      azucar_sustituida_g: 0,
      co2_evitado_total_kg: 0,
      anos_legado: '2008–2026',
    };
  }

  return data as EcosystemMetrics;
}
