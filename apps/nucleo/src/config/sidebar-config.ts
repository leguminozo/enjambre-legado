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

export const BOTTOM_NAV_KEYS = ['ejecutivo', 'colmenas', 'contabilidad', 'sistema'] as const

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    key: 'enjambre',
    label: 'EL ENJAMBRE',
    items: [
      {
        key: 'ecosistema',
        label: 'Ecosistema',
        icon: 'network',
        href: '/',
        greeting: 'Alma del Enjambre',
        mission: 'Todo está conectado en el bosque vivo',
      },
      {
        key: 'territorio',
        label: 'Territorio',
        icon: 'map',
        href: '/mapa',
        greeting: 'Cartógrafo del bosque',
        mission: '22 años de territorio vivo en Chiloé',
      },
      {
      key: 'colmenas',
      label: 'Colmenas',
      icon: 'hexagon',
      href: '/colmenas',
        greeting: 'Obrera del bosque',
        mission: 'El ciclo del ulmo guía tu día',
      },
      {
        key: 'bosque',
        label: 'Bosque',
        icon: 'tree-pine',
        href: '/regeneracion',
        greeting: 'Guardián del legado',
        mission: 'Cada árbol plantado es deuda con el futuro',
      },
      {
        key: 'productos',
        label: 'Productos',
        icon: 'shopping-bag',
        href: '/catalogo',
        greeting: 'Alquimista del panal',
        mission: 'La miel sin historia vale la mitad',
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
          key: 'costeo',
          label: 'Costeo',
          icon: 'flask-conical',
          href: '/costeo',
          greeting: 'Alquimista del número',
          mission: 'Cada frasco sin costo es miel que se pierde',
        },
        {
          key: 'produccion',
          label: 'Producción',
          icon: 'factory',
          href: '/produccion',
          greeting: 'Maestro del panal',
          mission: 'Cada lote es una verdad del proceso',
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
        key: 'comunidad',
        label: 'Comunidad',
        icon: 'megaphone',
        href: '/comunidad',
        greeting: 'Narrador del bosque',
        mission: 'La historia de cada árbol merece ser contada',
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
    ],
  },
  {
    key: 'gestion',
    label: 'GESTIÓN',
    items: [
        {
          key: 'calendario',
          label: 'Calendario',
          icon: 'calendar-days',
          href: '/calendario',
          greeting: 'Guardián del tiempo',
          mission: 'El ciclo del enjambre no se detiene',
        },
        {
          key: 'ejecutivo',
          label: 'Panel Ejecutivo',
          icon: 'bar-chart-3',
          href: '/ejecutivo',
          greeting: 'Comandante del enjambre',
          mission: 'Visión total, operación total',
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
          key: 'punto-venta',
          label: 'Punto de Venta',
          icon: 'store',
          href: '/punto-venta',
          greeting: 'Vendedor en terreno',
          mission: 'Cada sachet entregado planta un bosque',
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
      key: 'creadores-admin',
      label: 'Creadores Admin',
      icon: 'sparkles',
      href: '/creadores',
        greeting: 'Director de embajadores',
        mission: 'Quien representa la miel, representa el bosque',
      },
      {
        key: 'operadores-feria',
        label: 'Operadores Feria',
        icon: 'calendar',
        href: '/operadores-feria',
        greeting: 'Director de campo',
        mission: 'Contratos, consignación y arqueo sin subordinación',
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
]

export const ACCOUNT_ITEMS: SidebarItem[] = [
  {
    key: 'perfil',
    label: 'Perfil',
    icon: 'user-cog',
    href: '/perfil',
    greeting: 'Tu identidad en el bosque',
    mission: 'Datos personales, nivel Guardián, empresas',
  },
  {
    key: 'sistema',
    label: 'Sistema',
    icon: 'settings',
    href: '/configuracion',
    greeting: 'Configure su colmena digital',
    mission: 'Apariencia, notificaciones, sincronización',
  },
]

/** Rutas con ViewShell propio — ocultar título/misión duplicados en el header global */
export const VIEW_SHELL_PATHS = new Set([
  '/colmenas',
  '/regeneracion',
  '/costeo',
  '/produccion',
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
  '/creador',
  '/editor-tienda',
  '/punto-venta',
])

export function routeUsesViewShell(pathname: string): boolean {
  if (VIEW_SHELL_PATHS.has(pathname)) return true
  return [...VIEW_SHELL_PATHS].some(
    (path) => path !== '/' && pathname.startsWith(`${path}/`),
  )
}

export function findActiveItem(pathname: string): SidebarItem | undefined {
  const allItems = [...SIDEBAR_GROUPS.flatMap(g => g.items), ...ACCOUNT_ITEMS]
  const exactMatch = allItems.find(item => item.href === pathname)
  if (exactMatch) return exactMatch
  const match = allItems.find(item => item.href !== '/' && pathname.startsWith(item.href))
  return match
}

export function getItemsByGroup(groupKey: string): SidebarItem[] {
  return SIDEBAR_GROUPS.find(g => g.key === groupKey)?.items ?? []
}

export function getAllItems(): SidebarItem[] {
  return [...SIDEBAR_GROUPS.flatMap(g => g.items), ...ACCOUNT_ITEMS]
}

export function getSidebarGroupsForRole(role: RoleKey): SidebarGroup[] {
  return SIDEBAR_GROUPS
}

export function getAccountItemsForRole(role: RoleKey): SidebarItem[] {
  return ACCOUNT_ITEMS
}
