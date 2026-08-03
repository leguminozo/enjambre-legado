import type { RoleKey } from '@enjambre/auth/role-redirect'

export type BadgeDotColor = 'green' | 'orange' | 'red'

export type SidebarBadge =
  | { type: 'dot'; color: BadgeDotColor }
  | { type: 'count'; value: number }
  | null

export interface SidebarItem {
  key: string
  label: string
  icon: string
  href: string
  badge?: SidebarBadge
  greeting: string
  mission: string
}

export interface SidebarGroup {
  key: string
  label: string
  items: SidebarItem[]
}

/** Tabs de la navegación inferior (móvil) para el rol admin */
export const BOTTOM_NAV_KEYS = ['ejecutivo', 'colmenas', 'contabilidad', 'configuracion'] as const

/**
 * Módulos primarios del rail compacto (tablet / desktop colapsado).
 * Keys reales de SIDEBAR_GROUPS — no hrefs.
 */
export const RAIL_PRIMARY_KEYS = [
  'ejecutivo',
  'colmenas',
  'contabilidad',
  'productos',
  'despacho',
  'crm',
] as const

/**
 * Herramientas que se precargan en idle (requestIdleCallback) al entrar.
 * El resto de las rutas se descargan al hacer hover — evita bajar chunks
 * pesados (three.js ~1MB, leaflet, recharts) de vistas que no se usan.
 */
export const PREFETCH_PRIORITY_KEYS = [
  'ejecutivo',
  'colmenas',
  'produccion',
  'alambique',
  'productos',
  'costeo',
  'despacho',
  'contabilidad',
  'crm',
  'configuracion',
] as const

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    key: 'vision',
    label: 'VISIÓN',
    items: [
      {
        key: 'ejecutivo',
        label: 'Panel Ejecutivo',
        icon: 'bar-chart-3',
        href: '/ejecutivo',
        greeting: 'Comandante del enjambre',
        mission: 'Visión total, operación total',
      },
    ],
  },
  {
    key: 'recoleccion',
    label: 'RECOLECCIÓN',
    items: [
      {
        key: 'colmenas',
        label: 'Mis Colmenas',
        icon: 'hexagon',
        href: '/colmenas',
        greeting: 'Obrera del bosque',
        mission: 'El ciclo del ulmo guía tu día',
      },
      {
        key: 'apiarios',
        label: 'Apiarios',
        icon: 'warehouse',
        href: '/colmenas/apiarios',
        greeting: 'Guardián de apiarios',
        mission: 'Cada apiario es un ancla en el territorio',
      },
      {
        key: 'cuaderno-campo',
        label: 'Cuaderno Campo',
        icon: 'notebook-pen',
        href: '/colmenas/cuaderno',
        greeting: 'Cronista del apiario',
        mission: 'Cada anotación es memoria del ciclo',
      },
      {
        key: 'trazabilidad',
        label: 'Trazabilidad',
        icon: 'route',
        href: '/colmenas/trazabilidad',
        greeting: 'Tejedor de rastros',
        mission: 'Cada lote cuenta la historia del bosque',
      },
    ],
  },
  {
    key: 'bosque',
    label: 'BOSQUE',
    items: [
      {
        key: 'ciclo-bosque',
        label: 'Ciclo del Bosque',
        icon: 'calendar-days',
        href: '/calendario',
        greeting: 'Guardián del tiempo',
        mission: 'El ciclo del enjambre no se detiene',
      },
      {
        key: 'bosque',
        label: 'Bosque Plantado',
        icon: 'tree-pine',
        href: '/regeneracion',
        greeting: 'Guardián del legado',
        mission: 'Cada árbol plantado es deuda con el futuro',
      },
      {
        key: 'alambique',
        label: 'Alambique',
        icon: 'test-tubes',
        href: '/alambique',
        greeting: 'Alquimista del vapor',
        mission: 'Cada gota destilada es memoria del bosque',
      },
      {
        key: 'fenologia',
        label: 'Fenología',
        icon: 'sprout',
        href: '/fenologia',
        greeting: 'Oráculo del bosque',
        mission: 'La floración se mide, no se adivina',
      },
    ],
  },
  {
    key: 'produccion',
    label: 'PRODUCCIÓN',
    items: [
      {
        key: 'produccion',
        label: 'Inventario',
        icon: 'factory',
        href: '/produccion',
        greeting: 'Maestro del panal',
        mission: 'Cada lote es una verdad del proceso',
      },
      {
        key: 'costeo',
        label: 'Costeo',
        icon: 'flask-conical',
        href: '/costeo',
        greeting: 'Alquimista del número',
        mission: 'Cada frasco sin costo es miel que se pierde',
      },
    ],
  },
  {
    key: 'mercado',
    label: 'MERCADO',
    items: [
      {
        key: 'productos',
        label: 'Productos',
        icon: 'shopping-bag',
        href: '/catalogo',
        greeting: 'Alquimista del panal',
        mission: 'La miel sin historia vale la mitad',
      },
      {
        key: 'despacho',
        label: 'Despacho',
        icon: 'truck',
        href: '/operaciones',
        greeting: 'Arquitecto de flujos',
        mission: 'Del panal al consumidor, sin perder una gota',
      },
      {
        key: 'editor-tienda',
        label: 'Editor Tienda',
        icon: 'layout-template',
        href: '/editor-tienda',
        greeting: 'Director de marca',
        mission: 'La estética del panal define su valor',
      },
      {
        key: 'comunidad',
        label: 'Comunidad',
        icon: 'megaphone',
        href: '/comunidad',
        greeting: 'Narrador del bosque',
        mission: 'La historia de cada árbol merece ser contada',
      },
      {
        key: 'crm',
        label: 'CRM Vendedores',
        icon: 'contact',
        href: '/crm',
        greeting: 'Relacionador del legado',
        mission: 'Cada cliente es una historia que se cultiva',
      },
      {
        key: 'pipeline',
        label: 'Pipeline Ventas',
        icon: 'trending-up',
        href: '/pipeline',
        greeting: 'Arquitecto del flujo',
        mission: 'Cada lead es una semilla de bosque',
      },
      {
        key: 'monitor-feria',
        label: 'Monitor de Feria',
        icon: 'store',
        href: '/monitor-feria',
        greeting: 'Observador de feria',
        mission: 'Trazabilidad y observación en vivo de las ventas en feria',
      },
      {
        key: 'operadores-feria',
        label: 'Operadores Feria',
        icon: 'calendar',
        href: '/operadores-feria',
        greeting: 'Director de campo',
        mission: 'Contratos, consignación y arqueo sin subordinación',
      },
    ],
  },
  {
    key: 'red',
    label: 'RED',
    items: [
      {
        key: 'creadores-admin',
        label: 'Creadores Admin',
        icon: 'sparkles',
        href: '/creadores',
        greeting: 'Director de embajadores',
        mission: 'Quien representa la miel, representa el bosque',
      },
      {
        key: 'reglas-comision',
        label: 'Reglas de Comisión',
        icon: 'sliders',
        href: '/reglas-comision',
        greeting: 'Legislador del incentivo',
        mission: 'Reglas claras, ventas claras',
      },
      {
        key: 'invitaciones',
        label: 'Invitaciones',
        icon: 'ticket',
        href: '/invitaciones',
        greeting: 'Reclutador del legado',
        mission: 'Cada invitación es un nuevo guardián',
      },
    ],
  },
  {
    key: 'finanzas',
    label: 'FINANZAS',
    items: [
      {
        key: 'contabilidad',
        label: 'Contabilidad',
        icon: 'calculator',
        href: '/contable',
        greeting: 'Custodio del número',
        mission: 'Lo que no se mide, no se honra',
      },
      {
        key: 'sii',
        label: 'SII',
        icon: 'file-text',
        href: '/sii',
        greeting: 'Soldado tributario',
        mission: 'Cada DTE es una promesa al fisco',
      },
      {
        key: 'banco',
        label: 'Banco',
        icon: 'building-2',
        href: '/banco',
        greeting: 'Centinela del flujo',
        mission: 'Cada peso tiene ruta y razón',
      },
      {
        key: 'pagos',
        label: 'Pagos',
        icon: 'credit-card',
        href: '/pagos',
        greeting: 'Recolector del emporio',
        mission: 'Cada cobro en feria es semilla contable',
      },
      {
        key: 'conciliacion',
        label: 'Conciliación',
        icon: 'git-merge',
        href: '/conciliacion',
        greeting: 'Detective del balance',
        mission: 'Ningún peso huérfano, ninguna factura sin banco',
      },
      {
        key: 'reportes',
        label: 'Reportes',
        icon: 'printer',
        href: '/reportes',
        greeting: 'Archivero del tiempo',
        mission: 'El balance no miente, pero requiere testigo',
      },
      {
        key: 'calculos-ia',
        label: 'Cálculos IA',
        icon: 'sparkles',
        href: '/calculos-ia',
        greeting: 'Oráculo del número',
        mission: 'Proyecciones que alimentan contable y decisión',
      },
    ],
  },
  {
    key: 'territorio',
    label: 'TERRITORIO',
    items: [
      {
        key: 'territorio',
        label: 'Territorio',
        icon: 'map',
        href: '/mapa',
        greeting: 'Cartógrafo del bosque',
        mission: '22 años de territorio vivo en Chiloé',
      },
    ],
  },
]

export const ACCOUNT_ITEMS: SidebarItem[] = [
  {
    key: 'configuracion',
    label: 'Configuración',
    icon: 'settings',
    href: '/configuracion',
    greeting: 'Tu colmena digital',
    mission: 'Perfil, preferencias, seguridad y sistema',
  },
]

/** Rutas con ViewShell propio — ocultar título/misión duplicados en el header global */
export const VIEW_SHELL_PATHS = new Set([
  '/colmenas',
  '/regeneracion',
  '/costeo',
  '/produccion',
  '/alambique',
  '/operaciones',
  '/comunidad',
  '/contable',
  '/sii',
  '/banco',
  '/pagos',
  '/conciliacion',
  '/crm',
  '/pipeline',
  '/perfil',
  '/configuracion',
  '/ejecutivo',
  '/invitaciones',
  '/operadores-feria',
  '/calendario',
  '/editor-tienda',
  '/monitor-feria',
  '/calculos-ia',
  '/reportes',
  '/catalogo',
  '/mapa',
  '/territorio',
  '/registro-territorial',
  '/reglas-comision',
  '/fenologia',
])

/** Rutas que viven fuera del árbol de items pero pertenecen a un módulo del sidebar */
const ROUTE_ITEM_ALIASES: Record<string, string> = {
  '/territorio': 'territorio',
  '/registro-territorial': 'territorio',
}

/**
 * Ítems visibles por rol. Los roles no-admin (cliente/creador/rep_ventas) no viven
 * en nucleo — el middleware los redirige a tienda/campo; solo territorial tiene
 * home propio (`/territorio`). `[]` = todos los ítems.
 */
const ROLE_VISIBLE_KEYS: Record<RoleKey, readonly string[]> = {
  admin: [],
  territorial: ['territorio'],
  creador: [],
  rep_ventas: [],
  cliente: [],
}

/**
 * Overrides de href por rol: `/mapa` es admin-only; el territorial ve su registro
 * en `/territorio` (el item Territorio apunta a `/mapa` por defecto).
 */
const ROLE_HREF_OVERRIDES: Record<RoleKey, Record<string, string>> = {
  admin: {},
  territorial: { territorio: '/territorio' },
  creador: {},
  rep_ventas: {},
  cliente: {},
}

/** Tabs del bottom nav (móvil) por rol: territorial navega solo su registro */
export function getBottomNavKeysForRole(role: RoleKey): readonly string[] {
  if (role === 'territorial') return ['territorio']
  return BOTTOM_NAV_KEYS
}

export function routeUsesViewShell(pathname: string): boolean {
  if (VIEW_SHELL_PATHS.has(pathname)) return true
  return [...VIEW_SHELL_PATHS].some(
    (path) => path !== '/' && pathname.startsWith(`${path}/`),
  )
}

export function findActiveItem(pathname: string): SidebarItem | undefined {
  const allItems = [...SIDEBAR_GROUPS.flatMap(g => g.items), ...ACCOUNT_ITEMS]
  const aliasKey = ROUTE_ITEM_ALIASES[pathname]
  if (aliasKey) {
    const aliased = allItems.find(item => item.key === aliasKey)
    if (aliased) return aliased
  }
  const exactMatch = allItems.find(item => item.href === pathname)
  if (exactMatch) return exactMatch
  // Sub-rutas (/colmenas/apiarios) deben resaltar su ítem propio, no el padre (/colmenas)
  const matches = allItems
    .filter(item => item.href !== '/' && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)
  return matches[0]
}

export function getItemsByGroup(groupKey: string): SidebarItem[] {
  return SIDEBAR_GROUPS.find(g => g.key === groupKey)?.items ?? []
}

export function getAllItems(): SidebarItem[] {
  return [...SIDEBAR_GROUPS.flatMap(g => g.items), ...ACCOUNT_ITEMS]
}

/** Grupos visibles para el rol, con hrefs ajustados y grupos vacíos eliminados */
export function getSidebarGroupsForRole(role: RoleKey): SidebarGroup[] {
  const visible = ROLE_VISIBLE_KEYS[role]
  const overrides = ROLE_HREF_OVERRIDES[role] ?? {}
  return SIDEBAR_GROUPS
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => visible.length === 0 || visible.includes(item.key))
        .map((item) => (overrides[item.key] ? { ...item, href: overrides[item.key] } : item)),
    }))
    .filter((group) => group.items.length > 0)
}

export function getAccountItemsForRole(role: RoleKey): SidebarItem[] {
  const visible = ROLE_VISIBLE_KEYS[role]
  return ACCOUNT_ITEMS.filter((item) => visible.length === 0 || visible.includes(item.key))
}
