import type { Database } from '@enjambre/database';
import type { OrigenColmena } from './bitacora-types';

export type ColmenaRow = Database['public']['Tables']['colmenas']['Row'];
export type InspeccionRow = Database['public']['Tables']['inspecciones']['Row'];
export type VarroaRow = Database['public']['Tables']['varroa_records']['Row'];
export type PesoRow = Database['public']['Tables']['peso_records']['Row'];
export type ApiarioRow = Database['public']['Tables']['apiarios']['Row'];
export type CalendarioTaskRow = Database['public']['Tables']['calendario_tasks']['Row'];

// Extendemos el modelo básico de la tabla `colmenas` para añadir 
// las relaciones y campos virtuales que usamos en el UI visual del Dashboard Apicultor.
// OrigenColmena (migración 1008): provenance del núcleo/colmena.
export type ColmenaWithRelations = ColmenaRow & Partial<OrigenColmena> & {
  apiario_name?: string;
  lat?: number;
  lng?: number;
  inspecciones?: InspeccionRow[];
  varroa_records?: VarroaRow[];
  peso_records?: PesoRow[];
  costos?: {
    horas_anuales: number;
    costo_hora: number;
    amortizacion_cajon: number;
    insumos_anuales: number;
    produccion_kg: number;
  };
};
