import { LEGACY_ROLE_MAP, type RoleKey } from '@enjambre/auth/role-redirect'

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
  /**
   * Categoría desplegable (estándar industria): clic en el label expande
   * las micro-herramientas. Grupos de 1 ítem se renderizan planos.
   */
  collapsible?: boolean
}

/** Tabs de la navegación inferior (móvil) para el rol admin */
export const BOTTOM_NAV_KEYS = ['inicio', 'colmenas', 'contabilidad', 'configuracion'] as const

/**
 * Módulos primarios del rail compacto (tablet / desktop colapsado).
 * Keys reales de SIDEBAR_GROUPS — no hrefs.
 */
export const RAIL_PRIMARY_KEYS = [
  'inicio',
  'colmenas',
  'contabilidad',
  'inventario',
  'productos',
  'envios',
  'crm',
] as const

/**
 * Herramientas que se precargan en idle (requestIdleCallback) al entrar.
 * El resto de las rutas se descargan al hacer hover — evita bajar chunks
 * pesados (three.js ~1MB, leaflet, recharts) de vistas que no se usan.
 */
export const PREFETCH_PRIORITY_KEYS = [
  'inicio',
  'colmenas',
  'recoleccion',
  'inventario',
  'lotes',
  'alambique',
  'productos',
  'costeo',
  'envios',
  'contabilidad',
  'crm',
  'configuracion',
] as const

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    key: 'vision',
    label: 'VISIÓN',
    collapsible: false,
    items: [
      {
        key: 'inicio',
        label: 'Inicio',
        icon: 'network',
        href: '/inicio',
        greeting: 'Tu punto de partida',
        mission: 'Lo esencial del enjambre, según tu rol',
      },
    ],
  },
  {
    // Campo: bitácora minuciosa del ciclo de la colmena
    key: 'campo',
    label: 'CAMPO',
    collapsible: true,
    items: [
      {
        key: 'colmenas',
        label: 'Colmenas',
        icon: 'hexagon',
        href: '/colmenas',
        greeting: 'Obrera del bosque',
        mission: 'Apiarios y colmenas en un solo flujo: entrar, crear, editar',
      },
      {
        key: 'cuaderno-campo',
        label: 'Cuaderno de Campo',
        icon: 'notebook-pen',
        href: '/colmenas/cuaderno',
        greeting: 'Cronista del apiario',
        mission: 'Visitas, sanidad y red semántica del ciclo',
      },
    ],
  },
  {
    // Bosque: mundo vegetal, floración, regeneración, destilación
    key: 'bosque',
    label: 'BOSQUE',
    collapsible: true,
    items: [
      {
        key: 'fenologia',
        label: 'Oráculo Fenológico',
        icon: 'sprout',
        href: '/fenologia',
        greeting: 'Oráculo del bosque',
        mission: 'Índice de floración: la flor se mide, no se adivina',
      },
      {
        key: 'ciclo-bosque',
        label: 'Calendario',
        icon: 'calendar-days',
        href: '/calendario',
        greeting: 'Guardián del tiempo',
        mission: 'Ciclo estacional, floración y ventanas de trabajo',
      },
      {
        key: 'bosque',
        label: 'Plantaciones',
        icon: 'tree-pine',
        href: '/regeneracion',
        greeting: 'Guardián del legado',
        mission: 'Reforestación, regeneración y CO₂ del territorio',
      },
      {
        key: 'alambique',
        label: 'Alambique',
        icon: 'test-tubes',
        href: '/alambique',
        greeting: 'Alquimista del vapor',
        mission: 'Destilación de plantas: materia vegetal a hidrolato',
      },
    ],
  },
  {
    // Producción: recolección → lotes → inventario de frascos listos
    key: 'produccion',
    label: 'PRODUCCIÓN',
    collapsible: true,
    items: [
      {
        key: 'recoleccion',
        label: 'Recolección',
        icon: 'droplets',
        href: '/produccion/recoleccion',
        greeting: 'Recolector del panal',
        mission: 'Registro de recolecciones: kg, floración y vínculo a lote',
      },
      {
        key: 'lotes',
        label: 'Lotes',
        icon: 'factory',
        href: '/produccion/lotes',
        greeting: 'Maestro del panal',
        mission: 'Lotes en bodega, análisis de lab y pasaporte QR',
      },
      {
        key: 'inventario',
        label: 'Inventario',
        icon: 'package',
        href: '/produccion/inventario',
        greeting: 'Custodio del stock',
        mission: 'Productos, insumos, etiquetas, envases y material — con alertas',
      },
      {
        key: 'costeo',
        label: 'Costeo',
        icon: 'flask-conical',
        href: '/costeo',
        greeting: 'Alquimista del número',
        mission: 'Recetas y rentabilidad — insumos en Inventario',
      },
      {
        key: 'hidromiel',
        label: 'Hidromiel',
        icon: 'wine',
        href: '/hidromiel',
        greeting: 'Fermentador del bosque',
        mission: 'Lotes de hidromiel: construye tu proceso, mide, registra y traza la miel',
      },
    ],
  },
  {
    // Despacho: envíos, centros logísticos, proveedores, mapa — sin cajón monolítico
    key: 'despacho',
    label: 'DESPACHO',
    collapsible: true,
    items: [
      {
        key: 'envios',
        label: 'Envíos',
        icon: 'truck',
        href: '/despacho/envios',
        greeting: 'Arquitecto de flujos',
        mission: 'Cola de envíos: crear, estados y ventas a despachar',
      },
      {
        key: 'centros-stock',
        label: 'Centros de stock',
        icon: 'warehouse',
        href: '/despacho/centros',
        greeting: 'Guardián multicentro',
        mission: 'Stock por centro logístico (no el inventario de tienda)',
      },
      {
        key: 'proveedores',
        label: 'Proveedores',
        icon: 'users',
        href: '/despacho/proveedores',
        greeting: 'Red de insumos',
        mission: 'Proveedores, urgencias y próximas entregas',
      },
      {
        key: 'mapa-envios',
        label: 'Mapa de envíos',
        icon: 'map',
        href: '/despacho/mapa',
        greeting: 'Cartógrafo de rutas',
        mission: 'Historial geográfico de despachos',
      },
    ],
  },
  {
    key: 'mercado',
    label: 'MERCADO',
    collapsible: true,
    items: [
      {
        key: 'productos',
        label: 'Productos',
        icon: 'shopping-bag',
        href: '/catalogo',
        greeting: 'Editor de catálogo',
        mission: 'Ficha de tienda: nombre, foto, copy y precio — el stock vive en Inventario',
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
        mission: 'Observación en vivo de las ventas en feria',
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
    collapsible: true,
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
    // Finanzas: macro-categoría; SII/Banco se desfragmentarán más adelante
    key: 'finanzas',
    label: 'FINANZAS',
    collapsible: true,
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
    collapsible: false,
    items: [
      {
        key: 'territorio',
        label: 'Mapa del Legado',
        icon: 'map',
        href: '/mapa',
        greeting: 'Cartógrafo del bosque',
        mission: '22 años de territorio vivo en Chiloé · alertas fitosanitarias',
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
  '/despacho',
  '/comunidad',
  '/contable',
  '/sii',
  '/banco',
  '/pagos',
  '/conciliacion',
  '/crm',
  '/pipeline',
  '/configuracion',
  '/inicio',
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
  '/creadores',
])

/** Rutas que viven fuera del árbol de items pero pertenecen a un módulo del sidebar */
const ROUTE_ITEM_ALIASES: Record<string, string> = {
  '/territorio': 'territorio',
  '/registro-territorial': 'territorio',
  // Bookmarks legacy → herramienta canónica
  '/colmenas/trazabilidad': 'lotes',
  '/colmenas/apiarios': 'colmenas',
  '/produccion': 'inventario',
  '/operaciones': 'envios',
  '/despacho': 'envios',
}

/**
 * Ítems visibles por rol.
 * - `'all'` = menú completo (solo admin / legado→admin).
 * - lista = allowlist estricta.
 * - `[]` = sin módulos (cliente/creador/rep no viven en núcleo; middleware los saca).
 */
const ROLE_VISIBLE_KEYS: Record<RoleKey, readonly string[] | 'all'> = {
  admin: 'all',
  territorial: ['inicio', 'territorio', 'fenologia'],
  creador: [],
  rep_ventas: [],
  cliente: [],
}

/**
 * Rol para la shell de navegación. Nunca elevar a admin si falta el profile
 * (loading o sesión sin rol): least privilege → menú vacío, no el panel gerencial.
 */
export function resolveShellRoleKey(raw: string | undefined | null): RoleKey {
  if (!raw) return 'cliente'
  if (raw in LEGACY_ROLE_MAP) return LEGACY_ROLE_MAP[raw]!
  if (
    raw === 'admin' ||
    raw === 'territorial' ||
    raw === 'cliente' ||
    raw === 'creador' ||
    raw === 'rep_ventas'
  ) {
    return raw
  }
  return 'cliente'
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

/** Labels ajustados por rol (el territorial ve 'Mi Territorio', no 'Mapa del Legado') */
const ROLE_LABEL_OVERRIDES: Record<RoleKey, Record<string, string>> = {
  admin: {},
  territorial: { territorio: 'Mi Territorio' },
  creador: {},
  rep_ventas: {},
  cliente: {},
}

/** Tabs del bottom nav (móvil) por rol: territorial navega inicio + su registro */
export function getBottomNavKeysForRole(role: RoleKey): readonly string[] {
  if (role === 'territorial') return ['inicio', 'territorio']
  if (role === 'admin') return BOTTOM_NAV_KEYS
  return ['inicio']
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
  // Sub-rutas (/colmenas/apiarios) deben resaltar su ítem propio, no el padre
  const matches = allItems
    .filter(item => item.href !== '/' && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)
  return matches[0]
}

export function getAllItems(): SidebarItem[] {
  return [...SIDEBAR_GROUPS.flatMap(g => g.items), ...ACCOUNT_ITEMS]
}

function roleCanSeeItem(role: RoleKey, itemKey: string): boolean {
  const visible = ROLE_VISIBLE_KEYS[role] ?? []
  if (visible === 'all') return true
  return visible.includes(itemKey)
}

/** Grupos visibles para el rol, con hrefs/labels ajustados y grupos vacíos eliminados */
export function getSidebarGroupsForRole(role: RoleKey): SidebarGroup[] {
  const overrides = ROLE_HREF_OVERRIDES[role] ?? {}
  const labelOverrides = ROLE_LABEL_OVERRIDES[role] ?? {}
  return SIDEBAR_GROUPS
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => roleCanSeeItem(role, item.key))
        .map((item) => ({
          ...item,
          href: overrides[item.key] ? overrides[item.key] : item.href,
          label: labelOverrides[item.key] ? labelOverrides[item.key] : item.label,
        })),
    }))
    .filter((group) => group.items.length > 0)
}

export function getAccountItemsForRole(role: RoleKey): SidebarItem[] {
  return ACCOUNT_ITEMS.filter((item) => roleCanSeeItem(role, item.key))
}
