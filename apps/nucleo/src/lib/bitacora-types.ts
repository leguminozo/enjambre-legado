// Tipos explícitos de la bitácora apícola (migración 1006_bitacora_apicola.sql).
// El typegen de Supabase no está disponible en CI/local sin proyecto linkeado;
// estos tipos se alinean 1:1 con el schema canónico y se reemplazan por
// Database['public']['Tables'] al regenerar tipos.
// Referencia: docs/BITACORA_APICOLA.md §7.2

export type SesionBitacoraRow = {
  id: string;
  apiario_id: string | null;
  fecha: string;
  contexto: string | null;
  audio_url: string | null;
  duracion_seg: number | null;
  user_id: string | null;
  sincronizado_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CapturaVozRow = {
  id: string;
  session_id: string;
  colmena_id: string | null;
  client_request_id: string;
  audio_url: string | null;
  transcript_raw: string | null;
  estado:
    | 'capturado'
    | 'transcrito'
    | 'procesado'
    | 'en_revision'
    | 'confirmado'
    | 'descartado';
  atribucion_hipotesis: AtribucionHipotesis[];
  dispositivo: string | null;
  duracion_seg: number | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ParseResultHipotesis = {
  fase?: FaseBitacora;
  reina?: 'RV' | 'NV' | 'SR';
  poblacion?: string;
  marcos_cria: number;
  marcos_miel: number;
  cuadros: { cuerpo: CuerpoCuadro; tipo: TipoCuadro }[];
  notas: string;
};

export type AtribucionHipotesis = {
  colmena_id: string | null; // null = no resuelta contra las colmenas del usuario
  etiqueta: string; // forma hablada: "colmena veinte"
  numero: number;
  fragmento: string;
  confianza: number;
  resultado?: ParseResultHipotesis; // campos parseados (para la curaduría)
};

export type InspeccionCuadroRow = {
  id: string;
  inspeccion_id: string;
  posicion: number;
  cuerpo: 'nucleo' | 'camara' | 'alza_1' | 'alza_2' | 'alza_3';
  tipo:
    | 'cria_abierta'
    | 'cria_cerrada'
    | 'miel'
    | 'cera_labrada'
    | 'cera_estampada'
    | 'vacio'
    | 'polen';
  notas: string | null;
  user_id: string | null;
  created_at: string;
};

export type ReinaHistoryRow = {
  id: string;
  colmena_id: string;
  fecha: string;
  estado: 'RV' | 'NV' | 'SR';
  caracteristicas: Record<string, unknown> | null;
  reemplazada_por: string | null;
  user_id: string | null;
  created_at: string;
};

export type TratamientoRow = {
  id: string;
  colmena_id: string;
  fecha: string;
  producto_comercial: string | null;
  principio_activo: string;
  dosis_recomendada: string | null;
  dosis_aplicada: string | null;
  enfermedad: 'varroa' | 'nosema' | 'loque' | 'otro';
  via: string | null;
  forma: string | null;
  retiro_fin: string | null;
  contramuestreo_id: string | null;
  user_id: string | null;
  created_at: string;
};

export type MuestraRow = {
  id: string;
  apiario_id: string | null;
  fecha: string;
  tipo: 'varroa' | 'nosema' | 'otro';
  n_abejas: number | null;
  cuadros_muestreados: number | null;
  lab_nombre: string | null;
  lab_fecha: string | null;
  resultado: string | null;
  patogeno: 'varroa' | 'nosema' | 'DWV' | 'ABPV' | 'otro' | null;
  es_contramuestra: boolean;
  confirmado_saneado: boolean;
  user_id: string | null;
  created_at: string;
};

// Fase del ciclo de vida en la que ocurre una inspección de bitácora
// (columna `inspecciones.fase`, agregada en 1007_fix_colmenas_apiarios_columns).
export const FASES_BITACORA = [
  'nucleo',
  'traspaso',
  'alza',
  'cosecha',
  'invernada',
  'temporada',
] as const;
export type FaseBitacora = (typeof FASES_BITACORA)[number];

export const CUERPOS_CUADRO = [
  'nucleo',
  'camara',
  'alza_1',
  'alza_2',
  'alza_3',
] as const;
export type CuerpoCuadro = (typeof CUERPOS_CUADRO)[number];

export const TIPOS_CUADRO = [
  'cria_abierta',
  'cria_cerrada',
  'miel',
  'cera_labrada',
  'cera_estampada',
  'vacio',
  'polen',
] as const;
export type TipoCuadro = (typeof TIPOS_CUADRO)[number];

export type AlertaRetiro = {
  vigente: boolean;
  tratamiento_id: string | null;
  principio_activo: string | null;
  retiro_fin: string | null;
  mensaje: string | null;
};

// ---------------------------------------------------------------------------
// Provenance de la colmena (migración 1008_colmena_provenance.sql, §7.3)
// ---------------------------------------------------------------------------

export const TIPOS_ORIGEN = [
  'nucleo',
  'division',
  'enjambre',
  'compra',
  'traspaso',
  'otro',
] as const;
export type TipoOrigen = (typeof TIPOS_ORIGEN)[number];

export type OrigenColmena = {
  origen_tipo: TipoOrigen | null;
  origen_fecha: string | null;
  origen_colmena_madre: string | null;
  origen_detalle: string | null;
};

// ---------------------------------------------------------------------------
// Aumentación tipada del schema para el BFF (sin typegen disponible).
// `BitacoraDb` = Database canónico + tablas nuevas + columnas añadidas en
// 1007 (inspecciones.user_id / inspecciones.fase) y 1008 (colmenas.origen_*).
// Reemplazar por el typegen cuando haya proyecto linkeado.
// ---------------------------------------------------------------------------
import type { Database } from "@enjambre/database/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { VarroaRow } from "@/lib/apicultor-types";

type BitacoraTable<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type InspeccionRowWithBitacora = Database['public']['Tables']['inspecciones']['Row'] & {
  user_id: string | null;
  fase: FaseBitacora | null;
};

export type ColmenaRowWithOrigen = Database['public']['Tables']['colmenas']['Row'] & OrigenColmena & {
  // `estado` existe en la BD (migración 00: optima/atencion/riesgo) pero el
  // typegen no lo incluye; el código vivo lo usa vía cast — aquí se tipa.
  estado: string | null;
};

export type InspeccionCuadrosEnHistorial = InspeccionRowWithBitacora & {
  inspeccion_cuadros?: InspeccionCuadroRow[];
};

/** Respuesta de GET /api/bitacora/colmenas/:id */
export type HistorialColmena = {
  inspecciones: InspeccionCuadrosEnHistorial[];
  tratamientos: TratamientoRow[];
  reinas: ReinaHistoryRow[];
  alerta_retiro: AlertaRetiro;
  origen: OrigenColmena | null;
};

// Omit a nivel superior: `Database` ya tiene `reina_history` (stub con
// generation/origin/since/status en la BD real) — se reemplaza por el shape
// canónico de la bitácora (migración 1006), sin intersección con el stub.
export type BitacoraDb = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: Omit<Database['public']['Tables'], 'reina_history'> & {
      sesiones_bitacora: BitacoraTable<SesionBitacoraRow>;
      voice_inspection_captures: BitacoraTable<CapturaVozRow>;
      inspeccion_cuadros: BitacoraTable<InspeccionCuadroRow>;
      // Override: la BD real tiene un stub reina_history (generation/origin/
      // since/status) — la bitácora define el shape canónico (migración 1006).
      reina_history: BitacoraTable<ReinaHistoryRow>;
      tratamientos: BitacoraTable<TratamientoRow>;
      muestras: BitacoraTable<MuestraRow>;
      inspecciones: {
        Row: InspeccionRowWithBitacora;
        Insert: Partial<InspeccionRowWithBitacora>;
        Update: Partial<InspeccionRowWithBitacora>;
        Relationships: [];
      };
      colmenas: {
        Row: ColmenaRowWithOrigen;
        Insert: Partial<ColmenaRowWithOrigen>;
        Update: Partial<ColmenaRowWithOrigen>;
        Relationships: [];
      };
      // Capa manual de la red del cuaderno (migración 1010_cuaderno_crud)
      cuaderno_nodos: BitacoraTable<NodoManualRow>;
      cuaderno_aristas: BitacoraTable<AristaManualRow>;
    };
  };
};

export type BitacoraSupabase = SupabaseClient<BitacoraDb>;

// ---------------------------------------------------------------------------
// Cuaderno de campo v2 — red semántica territorial apícola
// ---------------------------------------------------------------------------

/** Nodo de la red del cuaderno. Los nodos derivados se componen en el BFF
 *  desde las tablas canónicas; los manuales viven en `cuaderno_nodos`. */
export type NodoRedCuaderno = {
  id: string; // UUID real de la entidad (colmena, inspección, tratamiento…)
  kind: 'apiario' | 'colmena' | 'hoja' | 'cuadro' | 'tratamiento' | 'muestra' | 'varroa' | 'manual';
  label: string;
  estado?: string | null; // colmena: estado; hoja: fase; manual: tipo
  apiario_name?: string | null;
  fecha?: string | null;
  colmena_id?: string | null;
  descripcion?: string | null;
  origen_tipo?: string | null;
  blockchain_hash?: string | null;
  x?: number | null;
  y?: number | null;
  created_at?: string | null;
};

/** Arista tipada: derivadas (contiene/registra/trata/muestra/monitorea/
 *  deriva_de) o manuales (cuaderno_aristas). */
export type AristaRedCuaderno = {
  id: string;
  source_id: string;
  target_id: string;
  relacion: string;
  label?: string | null;
};

export type BrechaColmena = {
  colmena_id: string;
  colmena_label: string;
  tipo: 'sin_hoja_14d' | 'sin_varroa_30d' | 'retiro_vigente';
  detalle: string;
};

export type RedCuaderno = {
  nodos: NodoRedCuaderno[];
  aristas: AristaRedCuaderno[];
  meta: {
    conteos: Record<string, number>;
    brechas: BrechaColmena[];
  };
};

/** Hoja de la colección (tarjeta del cuaderno) — GET /api/bitacora/hojas */
export type HojaCuaderno = InspeccionRowWithBitacora & {
  colmena: {
    id: string;
    name: string | null;
    apiario_id: string | null;
    blockchain_hash: string | null;
    origen_tipo: string | null;
    estado: string | null;
    alzas: number | null;
  } | null;
  apiario_name: string | null;
  cuadros_count: number;
  tratamientos_count: number;
  brechas: string[]; // 'sin_varroa' | 'sin_cuadros' | 'sin_notas' | 'retiro_vigente'
};

export type NodoManualRow = {
  id: string;
  user_id: string;
  colmena_id: string | null;
  tipo: 'observacion' | 'decision' | 'tension' | 'otro';
  label: string;
  descripcion: string | null;
  x: number | null;
  y: number | null;
  created_at: string;
  updated_at: string;
};

export type AristaManualRow = {
  id: string;
  user_id: string;
  source_id: string;
  target_id: string;
  relacion: 'deriva_de' | 'observa' | 'tension' | 'analogia' | 'otro';
  label: string | null;
  created_at: string;
};

/** Detalle de una hoja para la escena — GET /api/bitacora/hojas/:id */
export type HojaDetalle = {
  hoja: InspeccionCuadrosEnHistorial;
  colmena: (ColmenaRowWithOrigen & { apiario_name: string | null }) | null;
  tratamientos: TratamientoRow[];
  muestras: MuestraRow[];
  varroa: VarroaRow[];
  nodos_manuales: NodoManualRow[];
  aristas_manuales: AristaManualRow[];
  red: RedCuaderno;
  alerta_retiro: AlertaRetiro;
};

/** Tratamiento con contexto de colmena (GET /tratamientos enriquecido) */
export type TratamientoConColmena = TratamientoRow & {
  colmena_name: string | null;
  colmena_hash: string | null;
};

/** Muestra con contexto de apiario (GET /muestras enriquecido) */
export type MuestraConApiario = MuestraRow & {
  apiario_name: string | null;
};
