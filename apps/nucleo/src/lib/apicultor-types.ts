import type { Database } from '@enjambre/database';
import type { OrigenColmena } from './bitacora-types';

export type ColmenaRow = Database['public']['Tables']['colmenas']['Row'];
export type InspeccionRow = Database['public']['Tables']['inspecciones']['Row'];
export type VarroaRow = Database['public']['Tables']['varroa_records']['Row'];
export type PesoRow = Database['public']['Tables']['peso_records']['Row'];
export type ApiarioRow = Database['public']['Tables']['apiarios']['Row'];
export type TratamientoRow = Database['public']['Tables']['tratamientos']['Row'];

// Estado de cruce de un apiario operativo con su declaración en el Registro
// Territorial (ley vs vivo). Permite badge + detección de desfase en /colmenas.
export interface RegistroApiarioEstado {
  registro_id: string;
  apiario_origen_id: string;
  n_colmenas: number;
  sincronizado_en: string | null;
  activo: boolean;
  nombre?: string | null;
  comuna?: string;
  zona?: string;
  categoria?: string;
}
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
  // Historial sanitario (bitácora 1006): alimenta la supresión de acciones
  // varroa en hive-state cuando el tratamiento es reciente.
  tratamientos?: TratamientoRow[];
  costos?: {
    horas_anuales: number;
    costo_hora: number;
    amortizacion_cajon: number;
    insumos_anuales: number;
    produccion_kg: number;
  };
};
