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
      {
        key: 'creadores',
        label: 'Creadores',
        icon: 'sparkles',
        href: '/creador',
        greeting: 'Embajador del bosque',
        mission: 'Quien cuenta la miel, multiplica el legado',
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
        key: 'ia-fiscal',
        label: 'IA Fiscal',
        icon: 'cpu',
        href: '/calculos-ia',
        greeting: 'Estratega del tiempo',
        mission: 'El impuesto bien planificado es capital retenido',
      },
    ],
  },
  {
    key: 'gestion',
    label: 'GESTIÓN',
    items: [
      {
      key: 'ejecutivo',
      label: 'Panel Ejecutivo',
      icon: 'bar-chart-3',
      href: '/',
        greeting: 'Comandante del enjambre',
        mission: 'Visión total, operación total',
      },
      {
      key: 'vanguardia',
      label: 'Vanguardia B2B',
      icon: 'shield',
      href: '/vanguardia',
        greeting: 'General de alianzas',
        mission: 'Cada aliado multiplica el bosque',
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
      key: 'caja',
      label: 'Cierres de Caja',
      icon: 'wallet',
      href: '/caja',
        greeting: 'Guardián del efectivo',
        mission: 'Cada cierre es una verdad del día',
      },
      {
      key: 'reps',
      label: 'Reps de Ventas',
      icon: 'users',
      href: '/reps',
        greeting: 'Capitán de equipo',
        mission: 'Cada rep es un canal de bosque',
      },
      {
      key: 'comisiones',
      label: 'Comisiones',
      icon: 'percent',
      href: '/comisiones',
        greeting: 'Justicia distributiva',
        mission: 'Cada comisión es semilla de más ventas',
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
      {
      key: 'leaderboard',
      label: 'Leaderboard',
      icon: 'trophy',
      href: '/leaderboard',
        greeting: 'Árbitro de excelencia',
        mission: 'El ranking revela quien lleva el bosque en el alma',
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

export function findActiveItem(pathname: string): SidebarItem | undefined {
  const allItems = [...SIDEBAR_GROUPS.flatMap(g => g.items), ...ACCOUNT_ITEMS]
  if (pathname === '/') {
    return allItems.find(item => item.href === '/')
  }
  const match = allItems.find(item => item.href !== '/' && pathname.startsWith(item.href))
  return match
}

export function getItemsByGroup(groupKey: string): SidebarItem[] {
  return SIDEBAR_GROUPS.find(g => g.key === groupKey)?.items ?? []
}

export function getAllItems(): SidebarItem[] {
  return [...SIDEBAR_GROUPS.flatMap(g => g.items), ...ACCOUNT_ITEMS]
}
