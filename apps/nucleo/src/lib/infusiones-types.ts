import { z } from 'zod'

/* ── DTOs (respuesta del BFF) ─────────────────────────────────────────────── */

export interface MateriaPrimaRow {
  id: string
  nombre: string
  tipo: 'hierba' | 'especia' | 'otro'
  unidad_medida: string
  activa: boolean
  notas: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

export interface ProveedorRow {
  id: string
  nombre: string
  contacto: string | null
  ubicacion: string | null
  activa: boolean
  notas: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

export interface LoteEntradaRow {
  id: string
  codigo_lote: string
  materia_prima_id: string
  fecha: string
  origen: 'recoleccion' | 'compra' | 'cultivo'
  peso_fresco_kg: number | null
  precio_compra_clp: number | null
  proveedor_id: string | null
  recolector: string | null
  ubicacion_recoleccion: string | null
  notas: string | null
  materia_prima?: { id: string; nombre: string } | null
  proveedor?: { id: string; nombre: string } | null
  /** Presente cuando la entrada ya fue deshidratada (marca pendientes). */
  deshidratado?: { id: string } | null
  created_at: string
}

export interface LoteDeshidratadoRow {
  id: string
  lote_entrada_id: string
  fecha_inicio: string | null
  fecha_fin: string | null
  metodo: 'horno' | 'deshidratador' | 'aire'
  temperatura_c: number | null
  peso_entrada_kg: number | null
  peso_salida_kg: number | null
  rendimiento_pct: number | null
  responsable: string | null
  notas: string | null
  /** Gramos de este lote seco aún disponibles para producción (calculado en BFF). */
  stock_disponible_g: number | null
  lote_entrada?: {
    id: string
    codigo_lote: string
    materia_prima?: { id: string; nombre: string } | null
  } | null
  created_at: string
}

export interface FormulaIngredienteRow {
  id: string
  formula_id: string
  materia_prima_id: string
  porcentaje: number
  gramos_por_kg_mezcla: number
  materia_prima?: { id: string; nombre: string } | null
}

export interface FormulaRow {
  id: string
  nombre: string
  descripcion: string | null
  gramaje_sachet_g: number
  tipo: 'individual' | 'granel'
  activa: boolean
  ingredientes: FormulaIngredienteRow[]
  created_at: string
}

export interface ProduccionMaterialRow {
  id: string
  lote_produccion_id: string
  lote_deshidratado_id: string
  gramos_utilizados: number
  lote_deshidratado?: {
    id: string
    lote_entrada?: {
      codigo_lote: string
      materia_prima?: { nombre: string } | null
    } | null
  } | null
}

export interface LoteProduccionRow {
  id: string
  formula_id: string
  fecha: string
  peso_mezcla_kg: number | null
  cantidad_sachets: number | null
  responsable: string | null
  notas: string | null
  formula?: { id: string; nombre: string; gramaje_sachet_g: number; tipo: string } | null
  materiales: ProduccionMaterialRow[]
  created_at: string
}

export interface StockSecoRow {
  materia_prima_id: string
  materia_prima: string
  total_seco_kg: number
  consumido_kg: number
  stock_disponible_kg: number
}

export interface InfusionesDashboard {
  kpis: {
    total_fresco_kg: number
    total_seco_kg: number
    rendimiento_promedio_pct: number | null
    sachets_producidos: number
    lotes_pendientes_deshidratar: number
  }
  stock_seco: StockSecoRow[]
  ultimas_entradas: {
    id: string
    codigo_lote: string
    materia_prima: string
    fecha: string
    peso_fresco_kg: number | null
    origen: string
    deshidratado: boolean
  }[]
  /** Nombres ya usados como recolector/responsable (sugerencias para delegar). */
  responsables: string[]
}

export interface CostoMateriaRow {
  materia_prima_id: string
  materia_prima: string
  /** CLP por kg de materia seca (solo lotes con precio de compra). */
  costo_seco_kg_clp: number | null
  rendimiento_promedio_pct: number | null
  lotes_con_costo: number
}

export interface CostoFormulaRow {
  id: string
  nombre: string
  gramaje_sachet_g: number
  tipo: string
  costo_kg_mezcla_clp: number | null
  costo_sachet_clp: number | null
  /** true si algún ingrediente no tiene precio de compra registrado. */
  sin_precios: boolean
}

export interface PlanificacionIngredienteRow {
  materia_prima_id: string
  materia_prima: string
  porcentaje: number
  seco_necesario_kg: number
  disponible_kg: number
  deficit_kg: number
  rendimiento_pct: number | null
  /** Fresco a recolectar = seco necesario ÷ rendimiento histórico (null sin historial). */
  fresco_a_recolectar_kg: number | null
}

export interface PlanificacionResponse {
  formula: { id: string; nombre: string; gramaje_sachet_g: number }
  sachets: number
  total_seco_necesario_kg: number
  total_fresco_sugerido_kg: number | null
  por_ingrediente: PlanificacionIngredienteRow[]
}

export interface EquipoRow {
  id: string
  nombre: string
  rol_operacion: 'operario' | 'dosificador'
  activa: boolean
  notas: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

export type TareaTipo = 'recoleccion' | 'deshidratado' | 'molienda' | 'mezcla' | 'dosificado' | 'envasado'
export type TareaEstado = 'pendiente' | 'en_proceso' | 'completada'
export type TareaPrioridad = 'baja' | 'media' | 'alta' | 'urgente'

export interface TareaRow {
  id: string
  tipo: TareaTipo
  lote_entrada_id: string | null
  lote_deshidratado_id: string | null
  lote_produccion_id: string | null
  equipo_id: string | null
  estado: TareaEstado
  fecha_vencimiento: string | null
  prioridad: TareaPrioridad
  evidencia_path: string | null
  /** URL firmada por el BFF (bucket privado) — refrescar al listar. */
  evidencia_url: string | null
  completada_at: string | null
  completada_por: string | null
  notas: string | null
  equipo?: { id: string; nombre: string; rol_operacion: string } | null
  lote_entrada?: { id: string; codigo_lote: string } | null
  lote_deshidratado?: { id: string; lote_entrada: { codigo_lote: string } | null } | null
  lote_produccion?: { id: string; infusion_formulas: { nombre: string } | null } | null
  created_at: string
}

/* ── Opciones de formulario ───────────────────────────────────────────────── */

export const MATERIA_PRIMA_TIPO_OPTIONS = [
  { value: 'hierba', label: 'Hierba' },
  { value: 'especia', label: 'Especia' },
  { value: 'otro', label: 'Otro' },
]

export const LOTE_ORIGEN_OPTIONS = [
  { value: 'recoleccion', label: 'Recolección' },
  { value: 'compra', label: 'Compra' },
  { value: 'cultivo', label: 'Cultivo propio' },
]

export const DESHIDRATADO_METODO_OPTIONS = [
  { value: 'horno', label: 'Horno' },
  { value: 'deshidratador', label: 'Deshidratador' },
  { value: 'aire', label: 'Aire / secado natural' },
]

export const FORMULA_TIPO_OPTIONS = [
  { value: 'individual', label: 'Individual (sachet)' },
  { value: 'granel', label: 'Granel' },
]

export const EQUIPO_ROL_OPTIONS = [
  { value: 'operario', label: 'Operario' },
  { value: 'dosificador', label: 'Dosificador' },
]

export const TAREA_TIPO_OPTIONS = [
  { value: 'recoleccion', label: 'Recolección' },
  { value: 'deshidratado', label: 'Deshidratado' },
  { value: 'molienda', label: 'Molienda' },
  { value: 'mezcla', label: 'Mezcla' },
  { value: 'dosificado', label: 'Dosificado' },
  { value: 'envasado', label: 'Envasado' },
]

export const TAREA_ESTADO_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'completada', label: 'Completada' },
]

export const TAREA_PRIORIDAD_OPTIONS = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
]

export const MATERIA_PRIMA_TIPO_LABEL: Record<string, string> = Object.fromEntries(
  MATERIA_PRIMA_TIPO_OPTIONS.map((o) => [o.value, o.label]),
)
export const LOTE_ORIGEN_LABEL: Record<string, string> = Object.fromEntries(
  LOTE_ORIGEN_OPTIONS.map((o) => [o.value, o.label]),
)
export const DESHIDRATADO_METODO_LABEL: Record<string, string> = Object.fromEntries(
  DESHIDRATADO_METODO_OPTIONS.map((o) => [o.value, o.label]),
)
export const FORMULA_TIPO_LABEL: Record<string, string> = Object.fromEntries(
  FORMULA_TIPO_OPTIONS.map((o) => [o.value, o.label]),
)
export const EQUIPO_ROL_LABEL: Record<string, string> = Object.fromEntries(
  EQUIPO_ROL_OPTIONS.map((o) => [o.value, o.label]),
)
export const TAREA_TIPO_LABEL: Record<string, string> = Object.fromEntries(
  TAREA_TIPO_OPTIONS.map((o) => [o.value, o.label]),
)
export const TAREA_ESTADO_LABEL: Record<string, string> = Object.fromEntries(
  TAREA_ESTADO_OPTIONS.map((o) => [o.value, o.label]),
)
export const TAREA_PRIORIDAD_LABEL: Record<string, string> = Object.fromEntries(
  TAREA_PRIORIDAD_OPTIONS.map((o) => [o.value, o.label]),
)

/* ── Schemas de formulario (zod, compartidos con el BFF) ─────────────────── */

/** Vacío → null; NaN no se cuela como 0 (Number('') = 0). */
const emptyToNullNumber = (v: unknown): number | null => {
  if (v === '' || v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Opcionales ≥ 0 (precios, temperaturas). */
const optNonNeg = z.preprocess(emptyToNullNumber, z.number().min(0).nullable())
/** Opcionales > 0 (pesos, gramajes). */
const optPos = z.preprocess(emptyToNullNumber, z.number().positive().nullable())
/** Opcionales enteros ≥ 0 (sachets). */
const optIntNonNeg = z.preprocess(emptyToNullNumber, z.number().int().min(0).nullable())

const optStr = (max: number) =>
  z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.string().max(max).nullable(),
  ).optional()

const optUuid = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.string().uuid().nullable(),
)

const optDate = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : v),
  z.string().date().nullable(),
).optional()

export const materiaPrimaFormSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
    tipo: z.enum(['hierba', 'especia', 'otro']),
    unidad_medida: z.string().min(1, 'Indica la unidad').max(20),
    notas: optStr(2000),
  })
  .strict()

export type MateriaPrimaFormValues = z.infer<typeof materiaPrimaFormSchema>

export const proveedorFormSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
    contacto: optStr(200),
    ubicacion: optStr(200),
    notas: optStr(2000),
  })
  .strict()

export type ProveedorFormValues = z.infer<typeof proveedorFormSchema>

export const loteEntradaFormSchema = z
  .object({
    materia_prima_id: z.string().uuid('Selecciona la materia prima'),
    fecha: z.string().min(1, 'La fecha es obligatoria'),
    origen: z.enum(['recoleccion', 'compra', 'cultivo']),
    peso_fresco_kg: optPos,
    precio_compra_clp: optNonNeg,
    proveedor_id: optUuid,
    recolector: optStr(120),
    ubicacion_recoleccion: optStr(200),
    notas: optStr(2000),
  })
  .strict()

export type LoteEntradaFormValues = z.infer<typeof loteEntradaFormSchema>

export const loteDeshidratadoFormSchema = z
  .object({
    lote_entrada_id: z.string().uuid('Selecciona el lote de entrada'),
    fecha_inicio: z.string().optional().nullable(),
    fecha_fin: z.string().optional().nullable(),
    metodo: z.enum(['horno', 'deshidratador', 'aire']),
    temperatura_c: optNonNeg,
    peso_entrada_kg: optPos,
    peso_salida_kg: optPos,
    responsable: optStr(120),
    notas: optStr(2000),
  })
  .strict()

export type LoteDeshidratadoFormValues = z.infer<typeof loteDeshidratadoFormSchema>

export const formulaFormSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
    descripcion: optStr(2000),
    gramaje_sachet_g: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? Number.NaN : Number(v)),
      z.number().positive('El gramaje debe ser mayor a 0'),
    ),
    tipo: z.enum(['individual', 'granel']),
  })
  .strict()

export type FormulaFormValues = z.infer<typeof formulaFormSchema>

export const ingredienteFormSchema = z
  .object({
    materia_prima_id: z.string().uuid('Selecciona la materia prima'),
    porcentaje: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? Number.NaN : Number(v)),
      z.number().positive('Debe ser mayor a 0').max(100, 'Máximo 100'),
    ),
  })
  .strict()

export type IngredienteFormValues = z.infer<typeof ingredienteFormSchema>

export const loteProduccionFormSchema = z
  .object({
    formula_id: z.string().uuid('Selecciona la fórmula'),
    fecha: z.string().min(1, 'La fecha es obligatoria'),
    peso_mezcla_kg: optPos,
    cantidad_sachets: optIntNonNeg,
    responsable: optStr(120),
    notas: optStr(2000),
  })
  .strict()

export type LoteProduccionFormValues = z.infer<typeof loteProduccionFormSchema>

export const materialFormSchema = z
  .object({
    lote_deshidratado_id: z.string().uuid('Selecciona el lote seco'),
    gramos_utilizados: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? Number.NaN : Number(v)),
      z.number().positive('Debe ser mayor a 0'),
    ),
  })
  .strict()

export type MaterialFormValues = z.infer<typeof materialFormSchema>

export const equipoFormSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
    rol_operacion: z.enum(['operario', 'dosificador']),
    notas: optStr(2000),
  })
  .strict()

export type EquipoFormValues = z.infer<typeof equipoFormSchema>

export const tareaFormSchema = z
  .object({
    tipo: z.enum(['recoleccion', 'deshidratado', 'molienda', 'mezcla', 'dosificado', 'envasado']),
    lote_entrada_id: optUuid,
    lote_deshidratado_id: optUuid,
    lote_produccion_id: optUuid,
    equipo_id: optUuid,
    estado: z.enum(['pendiente', 'en_proceso', 'completada']),
    fecha_vencimiento: optDate,
    prioridad: z.enum(['baja', 'media', 'alta', 'urgente']),
    evidencia_path: optStr(500),
    notas: optStr(2000),
  })
  .strict()

export type TareaFormValues = z.infer<typeof tareaFormSchema>

/* ── Formateo ─────────────────────────────────────────────────────────────── */

export const fmtKg = (v: number | string | null | undefined): string => {
  if (v === null || v === undefined || v === '') return '—'
  return `${Number(v).toLocaleString('es-CL', { maximumFractionDigits: 3 })} kg`
}

export const fmtG = (v: number | string | null | undefined): string => {
  if (v === null || v === undefined || v === '') return '—'
  return `${Number(v).toLocaleString('es-CL', { maximumFractionDigits: 0 })} g`
}

export const fmtPct = (v: number | string | null | undefined): string => {
  if (v === null || v === undefined || v === '') return '—'
  return `${Number(v).toLocaleString('es-CL', { maximumFractionDigits: 1 })}%`
}

export const fmtFecha = (v: string | null | undefined): string => {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('es-CL')
}
