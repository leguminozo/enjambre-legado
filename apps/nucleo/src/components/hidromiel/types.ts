import type { Database } from '@enjambre/database/database.types';

type LotesRow = Database['public']['Tables']['lotes']['Row'];

export type HidromielMedicion = Database['public']['Tables']['hidromiel_mediciones']['Row'];
export type HidromielIngrediente = Database['public']['Tables']['hidromiel_ingredientes']['Row'];
export type HidromielEtapa = Database['public']['Tables']['hidromiel_etapas']['Row'];

export type HidromielLote = Database['public']['Tables']['hidromiel_lotes']['Row'] & {
  miel_lote: LotesRow | null;
};

export interface HidromielDetalle {
  lote: HidromielLote;
  mediciones: HidromielMedicion[];
  ingredientes: HidromielIngrediente[];
  etapas: HidromielEtapa[];
}

export interface LoteMielOpcion {
  id: string;
  nombre_lote: string | null;
  variedad_floral: string | null;
  kg_total: number | null;
}
