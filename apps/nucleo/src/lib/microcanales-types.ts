import { z } from 'zod'

/* ── DTOs (respuesta del BFF) ─────────────────────────────────────────────── */

export interface PuntoVentaRow {
  id: string
  nombre: string
  tipo: 'cafeteria' | 'tienda_gourmet' | 'hotel' | 'feria_evento' | 'otro'
  ciudad: string | null
  contacto_nombre: string | null
  contacto_email: string | null
  estado: 'prospecto' | 'activo' | 'pausado' | 'retirado'
  codigo_acceso: string
  origen: 'autonomo' | 'marca'
  user_id: string | null
  publico: boolean
  notas: string | null
  created_at: string
}

export interface RevendedorRow {
  id: string
  nombre: string
  whatsapp: string | null
  tipo_espacio: 'tienda' | 'fruteria' | 'feria' | 'espacio_propio' | 'otro'
  estado: 'prospecto' | 'activo' | 'pausado'
  codigo_revendedor: string
  origen: 'autonomo' | 'marca'
  user_id: string | null
  grupo_control: boolean
  notas: string | null
  created_at: string
}

export interface SetEntradaRow {
  id: string
  nombre: string
  descripcion: string | null
  precio_clp: number
  tipo_entorno: string
  incluye_materiales: boolean
  materiales_descripcion: string | null
  pack_digital: boolean
  activo: boolean
  sort_order: number
  items?: SetItemRow[]
}

export interface SetItemRow {
  id: string
  set_id: string
  producto_id: string
  cantidad: number
  es_degustacion: boolean
  notas: string | null
  productos?: { id: string; nombre: string; precio: number } | null
}

export interface PedidoRow {
  id: string
  punto_venta_id: string | null
  revendedor_id: string | null
  set_id: string | null
  fecha: string
  estado: 'solicitado' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado'
  monto_clp: number
  notas: string | null
  created_at: string
  set?: { id: string; nombre: string } | null
  punto_venta?: { id: string; nombre: string } | null
  revendedor?: { id: string; nombre: string } | null
}

export interface FidClienteRow {
  id: string
  email: string | null
  whatsapp: string | null
  codigo_cliente: string
  nombre: string | null
  consentimiento: boolean
  created_at: string
}

export interface FidMembresiaRow {
  id: string
  cliente_id: string
  punto_venta_id: string
  saldo_sellos: number
  saldo_puntos: number
  sellos_iniciales: number
  grupo_control: boolean
  created_at: string
  cliente?: { id: string; nombre: string | null; email: string | null; whatsapp: string | null; codigo_cliente: string } | null
  punto_venta?: { id: string; nombre: string } | null
}

export interface FidProgramaRow {
  id: string
  punto_venta_id: string
  tipo: 'sellos' | 'puntos'
  nombre: string
  regla: string
  umbral: number
  recompensa: string
  activo: boolean
}

export interface FidEventoRow {
  id: string
  cliente_id: string
  punto_venta_id: string
  tipo: string
  cantidad: number
  origen: string
  ref_id: string | null
  notas: string | null
  created_at: string
}

export interface FidCanjeRow {
  id: string
  cliente_id: string
  punto_venta_id: string
  recompensa: string
  costo: number
  estado: string
  fecha: string
  created_at: string
  cliente?: { nombre: string | null; email: string | null; whatsapp: string | null } | null
}

export interface FidValorRow {
  id: string
  clave: string
  nombre: string
  valor: number
  activo: boolean
  descripcion: string | null
}

export interface RetribucionReglaRow {
  id: string
  tipo: string
  nombre: string
  valor: number
  umbral_min_clp: number | null
  umbral_max_clp: number | null
  dias_max: number | null
  skus_min: number | null
  activo: boolean
  sort_order: number
}

export interface RetribucionTierRow {
  id: string
  nombre: string
  umbral_anual_clp: number
  beneficio: string
  sort_order: number
  activo: boolean
}

export interface RetribucionRow {
  id: string
  revendedor_id: string
  pedido_id: string
  tipo: string
  cantidad: number
  pct_aplicado: number | null
  estado: string
  notas: string | null
  created_at: string
}

export interface ResenaRevendedorRow {
  id: string
  revendedor_id: string
  rating: number
  texto: string
  estado: string
  created_at: string
  revendedor?: { id: string; nombre: string } | null
}

export interface SesionPercepcionRow {
  id: string
  punto_venta_id: string | null
  producto_id: string | null
  cliente_id: string | null
  origen: string
  completo: boolean
  agrado_1_5: number | null
  intencion_recompra: boolean | null
  tipo_evaluador: string
  created_at: string
  pares?: { par: string; valor: number }[]
  chips?: { bloque: string; chip: string }[]
  abierta?: { pregunta: string; texto: string } | null
}

export interface PercepcionAgregado {
  sesiones: SesionPercepcionRow[]
  n: number
  umbral_perfil: number
  perfil_listo: boolean
  pares_promedio: { par: string; promedio: number; n: number }[]
  chips_frecuencia: { bloque: string; chip: string; n: number }[]
  abiertas_recientes: { texto: string; created_at: string }[]
}

export interface ChipCatalogoRow {
  id: string
  bloque: 'sabor' | 'aroma' | 'textura' | 'color'
  chip: string
  activo: boolean
  sort_order: number
}

export interface PortalData {
  punto?: PuntoVentaRow | null
  revendedor?: RevendedorRow | null
  sets: SetEntradaRow[]
  pedidos: PedidoRow[]
  membresias: FidMembresiaRow[]
  programas: FidProgramaRow[]
  retribuciones: RetribucionRow[]
  tiers: (RetribucionTierRow & { progreso_clp: number; compras_12m_clp: number })[]
  resenas_revendedor: ResenaRevendedorRow[]
  credito_disponible: number
}

/* ── Opciones y labels ─────────────────────────────────────────────────────── */

export const PUNTO_VENTA_TIPO_OPTIONS = [
  { value: 'cafeteria', label: 'Cafetería' },
  { value: 'tienda_gourmet', label: 'Tienda gourmet' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'feria_evento', label: 'Feria / evento' },
  { value: 'otro', label: 'Otro' },
]
export const REVENDEDOR_ESPACIO_OPTIONS = [
  { value: 'tienda', label: 'Tienda' },
  { value: 'fruteria', label: 'Fruteria' },
  { value: 'feria', label: 'Feria' },
  { value: 'espacio_propio', label: 'Espacio propio' },
  { value: 'otro', label: 'Otro' },
]
export const PUNTO_ESTADO_OPTIONS = [
  { value: 'prospecto', label: 'Prospecto' },
  { value: 'activo', label: 'Activo' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'retirado', label: 'Retirado' },
]
export const PEDIDO_ESTADO_OPTIONS = [
  { value: 'solicitado', label: 'Solicitado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
]
export const PROGRAMA_TIPO_OPTIONS = [
  { value: 'sellos', label: 'Sellos (X compras → recompensa)' },
  { value: 'puntos', label: 'Puntos (por monto)' },
]
export const RETRIBUCION_TIPO_LABEL: Record<string, string> = {
  puntos_por_clp: 'Puntos por compra',
  rebate_porcentual: 'Rebate % por volumen',
  bonus_recompra_rapida: 'Bonus recompra rápida',
  bonus_rango: 'Bonus rango de SKUs',
  co_op: 'Fondo co-marketing',
}
export const PARES_SEMANTICOS = [
  { par: 'suave/intenso', izq: 'Suave', der: 'Intenso' },
  { par: 'dulce/acido', izq: 'Dulce', der: 'Ácido' },
  { par: 'liquida/cremosa', izq: 'Líquida', der: 'Cremosa' },
] as const

export const PUNTO_VENTA_TIPO_LABEL: Record<string, string> = Object.fromEntries(
  PUNTO_VENTA_TIPO_OPTIONS.map((o) => [o.value, o.label]),
)
export const REVENDEDOR_ESPACIO_LABEL: Record<string, string> = Object.fromEntries(
  REVENDEDOR_ESPACIO_OPTIONS.map((o) => [o.value, o.label]),
)
export const PEDIDO_ESTADO_LABEL: Record<string, string> = Object.fromEntries(
  PEDIDO_ESTADO_OPTIONS.map((o) => [o.value, o.label]),
)

/* ── Schemas (compartidos con el BFF) ─────────────────────────────────────── */

const emptyToNullNumber = (v: unknown): number | null => {
  if (v === '' || v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
const optStr = (max: number) =>
  z.preprocess((v) => (v === '' || v === undefined ? null : v), z.string().max(max).nullable()).optional()

const optUuidNullable = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : v),
  z.string().uuid().nullable(),
).optional()
const optInt = z.preprocess(emptyToNullNumber, z.number().int().nullable()).optional()

export const puntoVentaFormSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(120),
  tipo: z.enum(['cafeteria', 'tienda_gourmet', 'hotel', 'feria_evento', 'otro']),
  ciudad: optStr(120),
  contacto_nombre: optStr(120),
  contacto_email: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.string().email('Email inválido').nullable(),
  ).optional(),
  estado: z.enum(['prospecto', 'activo', 'pausado', 'retirado']),
  publico: z.boolean(),
  notas: optStr(2000),
})
export type PuntoVentaFormValues = z.infer<typeof puntoVentaFormSchema>

export const revendedorFormSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(120),
  whatsapp: optStr(40),
  tipo_espacio: z.enum(['tienda', 'fruteria', 'feria', 'espacio_propio', 'otro']),
  estado: z.enum(['prospecto', 'activo', 'pausado']),
  notas: optStr(2000),
})
export type RevendedorFormValues = z.infer<typeof revendedorFormSchema>

export const setEntradaFormSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(120),
  descripcion: optStr(2000),
  precio_clp: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? Number.NaN : Number(v)),
    z.number().int().min(0, 'Precio inválido'),
  ),
  tipo_entorno: z.string().min(1),
  incluye_materiales: z.boolean(),
  materiales_descripcion: optStr(2000),
  pack_digital: z.boolean(),
  activo: z.boolean(),
  sort_order: z.number().int().default(0),
})
export type SetEntradaFormValues = z.infer<typeof setEntradaFormSchema>

export const setItemFormSchema = z.object({
  producto_id: z.string().uuid('Selecciona un producto'),
  cantidad: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? Number.NaN : Number(v)),
    z.number().int().min(1, 'Cantidad inválida'),
  ),
  es_degustacion: z.boolean(),
  notas: optStr(500),
})
export type SetItemFormValues = z.infer<typeof setItemFormSchema>

export const pedidoFormSchema = z.object({
  punto_venta_id: optUuidNullable,
  revendedor_id: optUuidNullable,
  set_id: z.string().uuid('Selecciona un set'),
  notas: optStr(1000),
})
export type PedidoFormValues = z.infer<typeof pedidoFormSchema>

export const fidProgramaFormSchema = z.object({
  tipo: z.enum(['sellos', 'puntos']),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(120),
  regla: z.string().min(1, 'Explica la regla en dos oraciones').max(300),
  umbral: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? Number.NaN : Number(v)),
    z.number().int().positive('Umbral inválido'),
  ),
  recompensa: z.string().min(1, 'La recompensa es obligatoria').max(200),
  activo: z.boolean(),
})
export type FidProgramaFormValues = z.infer<typeof fidProgramaFormSchema>

export const fidValorFormSchema = z.object({
  clave: z.string().min(1).max(80),
  nombre: z.string().min(1).max(120),
  valor: z.preprocess(emptyToNullNumber, z.number().int().min(0)),
  activo: z.boolean(),
  descripcion: optStr(300),
})
export type FidValorFormValues = z.infer<typeof fidValorFormSchema>

export const retribucionReglaFormSchema = z.object({
  tipo: z.enum(['puntos_por_clp', 'rebate_porcentual', 'bonus_recompra_rapida', 'bonus_rango', 'co_op']),
  nombre: z.string().min(1).max(120),
  valor: z.preprocess(emptyToNullNumber, z.number().min(0)),
  umbral_min_clp: optInt,
  umbral_max_clp: optInt,
  dias_max: optInt,
  skus_min: optInt,
  activo: z.boolean(),
  sort_order: z.number().int().default(0),
})
export type RetribucionReglaFormValues = z.infer<typeof retribucionReglaFormSchema>

export const retribucionTierFormSchema = z.object({
  nombre: z.string().min(1).max(80),
  umbral_anual_clp: z.preprocess(emptyToNullNumber, z.number().int().min(0)),
  beneficio: z.string().min(1).max(300),
  sort_order: z.number().int().default(0),
  activo: z.boolean(),
})
export type RetribucionTierFormValues = z.infer<typeof retribucionTierFormSchema>

export const chipCatalogoFormSchema = z.object({
  bloque: z.enum(['sabor', 'aroma', 'textura', 'color']),
  chip: z.string().min(1).max(60),
  activo: z.boolean(),
  sort_order: z.number().int().default(0),
})
export type ChipCatalogoFormValues = z.infer<typeof chipCatalogoFormSchema>

export const resenaRevendedorFormSchema = z.object({
  rating: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? Number.NaN : Number(v)),
    z.number().int().min(1).max(5),
  ),
  texto: z.string().min(1, 'Cuenta tu experiencia').max(2000),
})
export type ResenaRevendedorFormValues = z.infer<typeof resenaRevendedorFormSchema>

/* ── Registros públicos (landing) ──────────────────────────────────────────── */

export const registroPuntoVentaSchema = z.object({
  nombre: z.string().min(1, 'Nombre del local').max(120),
  tipo: z.enum(['cafeteria', 'tienda_gourmet', 'hotel', 'feria_evento', 'otro']),
  ciudad: optStr(120),
  contacto_nombre: optStr(120),
  contacto_email: z.string().email('Email inválido').optional().or(z.literal('')),
})
export type RegistroPuntoVentaValues = z.infer<typeof registroPuntoVentaSchema>

export const registroRevendedorSchema = z.object({
  nombre: z.string().min(1, 'Tu nombre').max(120),
  whatsapp: optStr(40),
  tipo_espacio: z.enum(['tienda', 'fruteria', 'feria', 'espacio_propio', 'otro']),
})
export type RegistroRevendedorValues = z.infer<typeof registroRevendedorSchema>

export const registroClienteSchema = z.object({
  codigo_punto: z.string().min(4).max(20),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  whatsapp: optStr(40),
  nombre: optStr(120),
  consentimiento: z.boolean().refine((v) => v, 'Necesitamos tu consentimiento para registrar tu percepción'),
})
export type RegistroClienteValues = z.infer<typeof registroClienteSchema>

export const sesionPercepcionSchema = z.object({
  codigo_punto: z.string().min(4).max(20),
  producto_id: z.string().uuid().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')),
  whatsapp: optStr(40),
  codigo_cliente: optStr(20),
  consentimiento: z.boolean().refine((v) => v, 'Consentimiento requerido'),
  pares: z.array(z.object({ par: z.string().min(1), valor: z.number().int().min(-3).max(3) })).min(1),
  chips: z.array(z.object({ bloque: z.enum(['sabor', 'aroma', 'textura', 'color']), chip: z.string().min(1) })).min(1),
  abierta: z.string().max(280).optional().or(z.literal('')),
  agrado: z.number().int().min(1).max(5),
  intencion_recompra: z.boolean(),
  tipo_evaluador: z.enum(['consumidor', 'semi_entrenado']).default('consumidor'),
})
export type SesionPercepcionValues = z.infer<typeof sesionPercepcionSchema>
