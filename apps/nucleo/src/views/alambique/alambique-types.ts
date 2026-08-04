import { z } from 'zod'

/* ── DTOs (respuesta del BFF) ────────────────────────────────────────────── */

export interface PlantaRow {
  id: string
  nombre_comun: string
  nombre_cientifico: string | null
  parte_usada: string
  estado_material: string
  cantidad_kg: number
  origen: string | null
  lat: number | null
  lng: number | null
  fecha_recoleccion: string | null
  observaciones: string | null
  created_at: string
}

export interface DestilacionRow {
  id: string
  codigo: string | null
  metodo: string
  fecha_inicio: string
  fecha_fin: string | null
  carga_kg: number
  agua_l: number | null
  duracion_min: number | null
  temperatura_promedio: number | null
  rendimiento_hidrolato_ml: number | null
  rendimiento_aceite_ml: number | null
  estado: string
  publico: boolean
  relato_publico: string | null
  observaciones: string | null
  planta: {
    id: string
    nombre_comun: string
    nombre_cientifico: string | null
    parte_usada: string
    estado_material: string
    cantidad_kg: number
    origen: string | null
    fecha_recoleccion: string | null
  } | null
  productos: { id: string; tipo: string; volumen_ml: number; unidades: number; destino: string }[]
  analisis_organoleptico?: { color?: string; olor?: string; sabor?: string; textura?: string } | null
}

export interface ProductoDestilacionRow {
  id: string
  /** FK siempre presente; preferir sobre destilacion.id al editar. */
  destilacion_id: string
  tipo: string
  volumen_ml: number
  envase: string | null
  unidades: number
  fecha_envasado: string | null
  destino: string
  precio_sugerido_clp: number | null
  observaciones: string | null
  destilacion: { id: string; codigo: string | null; fecha_inicio: string; planta_nombre: string } | null
  producto_venta: { id: string; nombre: string; stock: number; visible: boolean } | null
}

export interface ProductoVentaOption {
  id: string
  nombre: string
  stock: number
  visible: boolean
}

export interface DashboardData {
  stats: {
    total_plantas: number
    total_destilaciones: number
    en_proceso: number
    total_hidrolato_ml: number
    total_aceite_ml: number
    rendimiento_ml_por_kg: number
  }
  por_planta: {
    nombre: string
    destilaciones: number
    hidrolato_ml: number
    aceite_ml: number
    carga_kg: number
    rendimiento_ml_por_kg: number
  }[]
  ultimas: {
    id: string
    codigo: string | null
    planta: string
    fecha_inicio: string
    estado: string
    rendimiento_hidrolato_ml: number | null
  }[]
}

/* ── Opciones de formulario ──────────────────────────────────────────────── */

export const PARTE_USADA_OPTIONS = [
  { value: 'hojas', label: 'Hojas' },
  { value: 'flores', label: 'Flores' },
  { value: 'corteza', label: 'Corteza' },
  { value: 'raices', label: 'Raíces' },
  { value: 'semillas', label: 'Semillas' },
  { value: 'frutos', label: 'Frutos' },
  { value: 'ramas', label: 'Ramas' },
  { value: 'otra', label: 'Otra' },
]

export const ESTADO_MATERIAL_OPTIONS = [
  { value: 'fresco', label: 'Fresco' },
  { value: 'seco', label: 'Seco' },
  { value: 'semicresco', label: 'Semicresco' },
]

export const METODO_OPTIONS = [
  { value: 'arrastre_vapor', label: 'Arrastre de vapor' },
  { value: 'hidrodestilacion', label: 'Hidrodestilación' },
]

export const ESTADO_DESTILACION_OPTIONS = [
  { value: 'planificada', label: 'Planificada' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'descartada', label: 'Descartada' },
]

export const TIPO_PRODUCTO_OPTIONS = [
  { value: 'hidrolato', label: 'Hidrolato' },
  { value: 'aceite_esencial', label: 'Aceite esencial' },
  { value: 'otro', label: 'Otro' },
]

export const DESTINO_OPTIONS = [
  { value: 'venta', label: 'Venta' },
  { value: 'uso_propio', label: 'Uso propio' },
  { value: 'regalo', label: 'Regalo' },
  { value: 'investigacion', label: 'Investigación' },
]

export const PARTE_USADA_LABEL: Record<string, string> = Object.fromEntries(
  PARTE_USADA_OPTIONS.map((o) => [o.value, o.label]),
)
export const METODO_LABEL: Record<string, string> = Object.fromEntries(
  METODO_OPTIONS.map((o) => [o.value, o.label]),
)
export const ESTADO_DESTILACION_LABEL: Record<string, string> = Object.fromEntries(
  ESTADO_DESTILACION_OPTIONS.map((o) => [o.value, o.label]),
)
export const TIPO_PRODUCTO_LABEL: Record<string, string> = Object.fromEntries(
  TIPO_PRODUCTO_OPTIONS.map((o) => [o.value, o.label]),
)
export const DESTINO_LABEL: Record<string, string> = Object.fromEntries(
  DESTINO_OPTIONS.map((o) => [o.value, o.label]),
)

/* ── Schemas de formulario (zod) ─────────────────────────────────────────── */

/** Vacío → null; NaN no se cuela como 0 (Number('') = 0). */
const emptyToNullNumber = (v: unknown): number | null => {
  if (v === '' || v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Volúmenes / cantidades opcionales ≥ 0 (agua, rendimientos, precios). */
const optNonNeg = z.preprocess(emptyToNullNumber, z.number().min(0).nullable())

/** Lat/lng: Chiloé y el sur son negativos — no reutilizar min(0). */
const optLat = z.preprocess(emptyToNullNumber, z.number().min(-90).max(90).nullable())
const optLng = z.preprocess(emptyToNullNumber, z.number().min(-180).max(180).nullable())

const reqNum = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? Number.NaN : Number(v)),
  z.number().positive(),
)

const optDate = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : v),
  z.string().date().nullable(),
)

const optUuid = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.string().uuid().nullable().optional(),
)

export const plantaFormSchema = z
  .object({
    nombre_comun: z.string().min(1, 'El nombre común es obligatorio').max(200),
    nombre_cientifico: z.string().max(300).optional().nullable(),
    parte_usada: z.enum(['hojas', 'flores', 'corteza', 'raices', 'semillas', 'frutos', 'ramas', 'otra']),
    estado_material: z.enum(['fresco', 'seco', 'semicresco']),
    cantidad_kg: reqNum,
    origen: z.string().max(300).optional().nullable(),
    lat: optLat,
    lng: optLng,
    fecha_recoleccion: optDate,
    observaciones: z.string().max(5000).optional().nullable(),
  })
  .strict()

export type PlantaFormValues = z.infer<typeof plantaFormSchema>

export const organolepticoSchema = z
  .object({
    color: z.string().max(200).optional(),
    olor: z.string().max(200).optional(),
    sabor: z.string().max(200).optional(),
    textura: z.string().max(200).optional(),
  })
  .optional()

export const destilacionFormSchema = z
  .object({
    planta_id: z.string().uuid('Selecciona una materia prima'),
    metodo: z.enum(['hidrodestilacion', 'arrastre_vapor']),
    fecha_inicio: z.string().min(1, 'Indica la fecha y hora de inicio'),
    fecha_fin: z.string().optional().nullable(),
    carga_kg: reqNum,
    agua_l: optNonNeg,
    duracion_min: z.preprocess(
      emptyToNullNumber,
      z.number().int().positive().nullable(),
    ),
    temperatura_promedio: z.preprocess(
      emptyToNullNumber,
      z.number().min(0).max(200).nullable(),
    ),
    rendimiento_hidrolato_ml: optNonNeg,
    rendimiento_aceite_ml: optNonNeg,
    analisis_organoleptico: organolepticoSchema,
    observaciones: z.string().max(5000).optional().nullable(),
    estado: z.enum(['planificada', 'en_proceso', 'finalizada', 'descartada']),
    publico: z.boolean(),
    relato_publico: z.string().max(5000).optional().nullable(),
  })
  .strict()

export type DestilacionFormValues = z.infer<typeof destilacionFormSchema>

export const productoFormSchema = z
  .object({
    destilacion_id: z.string().uuid('Selecciona una destilación'),
    tipo: z.enum(['hidrolato', 'aceite_esencial', 'otro']),
    volumen_ml: reqNum,
    envase: z.string().max(200).optional().nullable(),
    unidades: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? Number.NaN : Number(v)),
      z.number().int().positive(),
    ),
    fecha_envasado: optDate,
    destino: z.enum(['venta', 'uso_propio', 'regalo', 'investigacion']),
    producto_id: optUuid,
    precio_sugerido_clp: z.preprocess(
      emptyToNullNumber,
      z.number().int().min(0).nullable(),
    ),
    observaciones: z.string().max(5000).optional().nullable(),
  })
  .strict()

export type ProductoFormValues = z.infer<typeof productoFormSchema>

/** Convierte datetime-local → ISO (la BFF espera TIMESTAMPTZ). */
export function toIso(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}
