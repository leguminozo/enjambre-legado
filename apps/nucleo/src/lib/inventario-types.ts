/** Categorías del inventario operativo OYZ (no confundir con productos de tienda). */
export const INVENTARIO_CLASES = [
  {
    id: 'producto',
    label: 'Productos',
    short: 'Venta',
    description: 'Frascos y SKUs listos para la tienda (stock en catálogo).',
    icon: 'package',
  },
  {
    id: 'insumo',
    label: 'Insumos',
    short: 'Insumos',
    description: 'Consumibles de producción (tratamientos, cera, nutrientes). El granel se gestiona en Lotes.',
    icon: 'flask',
  },
  {
    id: 'etiqueta',
    label: 'Etiquetas',
    short: 'Etiquetas',
    description: 'Rollos y planchas de etiqueta por SKU o temporada.',
    icon: 'tag',
  },
  {
    id: 'envase',
    label: 'Envases',
    short: 'Envases',
    description: 'Frascos vacíos, tapas, sachets, cajas y cofres.',
    icon: 'box',
  },
  {
    id: 'apicola',
    label: 'Apícola',
    short: 'Material',
    description: 'Alzas, marcos, cera estampada, núcleos y equipo de apiario.',
    icon: 'hexagon',
  },
  {
    id: 'destilacion',
    label: 'Destilación',
    short: 'Alambique',
    description: 'Materia vegetal, botellas e insumos de hidrolatos.',
    icon: 'droplets',
  },
] as const

export type InventarioClaseId = (typeof INVENTARIO_CLASES)[number]['id']

/** Clases que viven en tabla inventario_items (no en productos). */
export type InventarioItemClase = Exclude<InventarioClaseId, 'producto'>

export const UNIDADES_INVENTARIO = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'l', label: 'L' },
  { value: 'ml', label: 'ml' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'plancha', label: 'Plancha' },
  { value: 'caja', label: 'Caja' },
] as const

export type InventarioItem = {
  id: string
  user_id: string | null
  empresa_id: string | null
  clase: InventarioItemClase
  nombre: string
  sku_code: string | null
  unidad: string
  stock: number
  stock_minimo: number
  costo_unitario: number
  producto_id: string | null
  ingredient_id: string | null
  proveedor_nota: string | null
  notas: string | null
  activo: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type InventarioMovimiento = {
  id: string
  item_id: string
  user_id: string | null
  tipo: 'entrada' | 'salida' | 'ajuste' | 'merma'
  cantidad: number
  stock_antes: number
  stock_despues: number
  motivo: string | null
  ref_tipo: string | null
  ref_id: string | null
  created_at: string
}

export function itemEnAlerta(item: Pick<InventarioItem, 'stock' | 'stock_minimo' | 'activo'>): boolean {
  if (!item.activo) return false
  return Number(item.stock) <= Number(item.stock_minimo)
}

export function claseMeta(id: InventarioClaseId) {
  return INVENTARIO_CLASES.find((c) => c.id === id) ?? INVENTARIO_CLASES[0]
}
