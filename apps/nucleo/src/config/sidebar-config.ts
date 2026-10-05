import { LEGACY_ROLE_MAP, type RoleKey } from '@enjambre/auth/role-redirect'
import {
  getTerritorialBottomNavKeys,
  getTerritorialVisibleKeys,
} from '@/lib/territorial-rol'

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
  'infusiones',
  'productos',
  'proveedores',
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
      {
        key: 'ciclo-bosque',
        label: 'Calendario',
        icon: 'calendar-days',
        href: '/calendario',
        greeting: 'Guardián del tiempo',
        mission: 'Planificación integral de actividades, eventos, ferias y operaciones',
      },
    ],
  },
  {
    // Campo: bitácora minuciosa del ciclo de la colmena
    key: 'campo',
    label: 'ENTORNO APÍCOLA',
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
    // Bosque: mundo vegetal, floración, regeneración
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
        key: 'bosque',
        label: 'Plantaciones',
        icon: 'tree-pine',
        href: '/regeneracion',
        greeting: 'Guardián del legado',
        mission: 'Reforestación, regeneración y CO₂ del territorio',
      },
      {
        key: 'especies-nativas',
        label: 'Especies Nativas',
        icon: 'flower-2',
        href: '/fenologia/especies',
        greeting: 'Botánico del bosque',
        mission: 'Catastro de flora nativa melífera, umbrales térmicos y floración',
      },
    ],
  },
  {
    // Producción: recolección → lotes → inventario → abastecimiento → costeo → transformación
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
        key: 'centros-stock',
        label: 'Centros de stock',
        icon: 'warehouse',
        href: '/despacho/centros',
        greeting: 'Guardián multicentro',
        mission: 'Distribuye el inventario general a cada punto de distribución y despacho',
      },
      {
        key: 'proveedores',
        label: 'Abastecimiento',
        icon: 'truck',
        href: '/despacho/proveedores',
        greeting: 'Red de insumos',
        mission: 'Proveedores, recepción de facturas/DTE y urgencias de stock',
      },
      {
        key: 'costeo',
        label: 'Costeo',
        icon: 'flask-conical',
        href: '/costeo',
        greeting: 'Alquimista del número',
        mission: 'Recetas y rentabilidad',
      },
      {
        key: 'alambique',
        label: 'Alambique',
        icon: 'test-tubes',
        href: '/alambique',
        greeting: 'Alquimista del vapor',
        mission: 'Destilación de plantas: materia vegetal a hidrolato',
      },
      {
        key: 'hidromiel',
        label: 'Hidromiel',
        icon: 'wine',
        href: '/hidromiel',
        greeting: 'Fermentador del bosque',
        mission: 'Lotes de hidromiel: construye tu proceso, mide, registra y traza la miel',
      },
      {
        key: 'infusiones',
        label: 'Infusiones',
        icon: 'leaf',
        href: '/produccion/infusiones',
        greeting: 'Herbario del bosque',
        mission: 'Hierbas e infusiones: entrada fresca, deshidratado, fórmulas y sachets trazables',
      },
    ],
  },
  {
    // Despacho: envíos y logística de salida
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
        mission: 'Ficha de tienda: nombre, foto, copy y precio',
      },
      {
        key: 'taxonomias',
        label: 'Formatos y Categorías',
        icon: 'tags',
        href: '/catalogo/taxonomias',
        greeting: 'Arquitecto de taxonomías',
        mission: 'Configuración de taxonomías de tienda: envases, pesos, variedades botánicas y sellos',
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
        key: 'estudio-rrss',
        label: 'Estudio RRSS',
        icon: 'sparkles',
        href: '/estudio-rrss',
        greeting: 'Editor de láminas',
        mission: 'Diseño, validación anti-slop y exportación de láminas 4:5 para Instagram y X',
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
        key: 'resenas',
        label: 'Reseñas Sensoriales',
        icon: 'compass',
        href: '/crm/resenas',
        greeting: 'Sommelier del bosque',
        mission: 'Notas de cata, percepciones y huella sensorial de los clientes',
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
      {
        key: 'microcanales',
        label: 'Microcanales',
        icon: 'store',
        href: '/microcanales',
        greeting: 'Arquitecto de microcanales',
        mission: 'Puntos de venta, revendedores, sets, fidelización y percepción sensorial',
      },
      {
        key: 'planes-suscripcion',
        label: 'Suscripciones Club',
        icon: 'repeat',
        href: '/planes-suscripcion',
        greeting: 'Custodio del club',
        mission: 'Planes de reposición mensual y trimestral para guardianes del bosque',
      },
      {
        key: 'descuentos',
        label: 'Cupones & Descuentos',
        icon: 'percent',
        href: '/descuentos',
        greeting: 'Estratega comercial',
        mission: 'Códigos promocionales, porcentajes y beneficios de compra',
      },
      {
        key: 'club-legado',
        label: 'Club Legado',
        icon: 'crown',
        href: '/club-legado',
        greeting: 'Custodio del Club Legado',
        mission: 'Beneficios, tiers de guardián, sellos y colmenas de suscriptores',
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
        icon: 'users',
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
    ],
  },
  {
    // Finanzas: macro-categoría de tesorería y contabilidad
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
        key: 'analisis-cruzado',
        label: 'Análisis Multicanal',
        icon: 'trending-up',
        href: '/analisis',
        greeting: 'Estratega del flujo',
        mission: 'Márgenes cruzados, rotación y comisiones por canal comercial',
      },
    ],
  },
  {
    // SII: gestión tributaria, DTEs, RCV, F29 e IA fiscal
    key: 'fiscal',
    label: 'SII',
    collapsible: true,
    items: [
      {
        key: 'sii',
        label: 'DTE & Facturación',
        icon: 'file-text',
        href: '/sii',
        greeting: 'Soldado tributario',
        mission: 'Cada DTE es una promesa al fisco',
      },
      {
        key: 'rcv',
        label: 'Registro Compras y Ventas',
        icon: 'receipt',
        href: '/sii/rcv',
        greeting: 'Auditor tributario',
        mission: 'Sincronización mensual directa con el SII: compras, ventas y aceptación',
      },
      {
        key: 'impuestos',
        label: 'Impuestos & F29',
        icon: 'landmark',
        href: '/sii/impuestos',
        greeting: 'Declarador fiscal',
        mission: 'Propuesta mensual F29, retenciones BHE y declaración anual F22',
      },
      {
        key: 'calculos-ia',
        label: 'Cálculos IA Fiscal',
        icon: 'brain',
        href: '/calculos-ia',
        greeting: 'Estratega fiscal',
        mission: 'Proyecciones de PPM y optimización tributaria con inteligencia artificial',
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
      {
        key: 'mapa-red',
        label: 'Mapa de la red',
        icon: 'map',
        href: '/territorio/mapa',
        greeting: 'Mapa comunitario',
        mission: 'Zonas de pecoreo aproximadas, sin GPS exacto',
      },
      {
        key: 'alertas-red',
        label: 'Alertas',
        icon: 'triangle-alert',
        href: '/territorio/alertas',
        greeting: 'Alertas fitosanitarias',
        mission: 'Avisos de aplicaciones cerca de tu zona',
      },
      {
        key: 'trashumancia',
        label: 'Trashumancia',
        icon: 'truck',
        href: '/territorio/trashumancia',
        greeting: 'Trashumancia declarada',
        mission: 'Ingresos, predios y distancias de apoyo',
      },
      {
        key: 'declaracion-sag',
        label: 'Declaración SAG',
        icon: 'file-text',
        href: '/declaracion-sag',
        greeting: 'Declaración anual',
        mission: 'Apoyo para el registro SAG. Tú firmas ante la autoridad',
      },
      {
        key: 'registro-comunal',
        label: 'Censo comunal',
        icon: 'users',
        href: '/registro-territorial',
        greeting: 'Red territorial',
        mission: 'Actores, apiarios y agregados de la comuna',
      },
      {
        key: 'mis-planes',
        label: 'Mis planes',
        icon: 'credit-card',
        href: '/mis-planes',
        greeting: 'Planes de la red',
        mission: 'QR ilimitados y cuaderno Res. 4590. El censo sigue gratis',
      },
    ],
  },
  {
    key: 'plataforma',
    label: 'PLATAFORMA',
    collapsible: true,
    items: [
      {
        key: 'integraciones',
        label: 'Integraciones',
        icon: 'plug',
        href: '/integraciones',
        greeting: 'Conectividad y pasarelas',
        mission: 'Webpay, SumUp, Banco de Chile, APIs publicitarias y caché',
      },
      {
        key: 'salud',
        label: 'Salud & Seguridad',
        icon: 'shield-alert',
        href: '/salud',
        greeting: 'Centinela del sistema',
        mission: 'Métricas de base de datos, crons, webhooks y auditoría de seguridad',
      },
      {
        key: 'invitaciones',
        label: 'Cuentas & Accesos',
        icon: 'users',
        href: '/invitaciones',
        greeting: 'Custodio de identidades',
        mission: 'Directorio de cuentas, roles del ecosistema y asignación de accesos',
      },
      {
        key: 'centro-correos',
        label: 'Centro de Correos',
        icon: 'mail',
        href: '/configuracion/correos',
        greeting: 'Control de correos',
        mission: 'Plantillas, canales y envíos del sistema',
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
  '/colmenas/cuaderno',
  '/colmenas/apiarios',
  '/colmenas/trazabilidad',
  '/regeneracion',
  '/costeo',
  '/produccion',
  '/produccion/recoleccion',
  '/produccion/lotes',
  '/produccion/inventario',
  '/produccion/infusiones',
  '/alambique',
  '/despacho',
  '/despacho/envios',
  '/despacho/centros',
  '/despacho/proveedores',
  '/despacho/mapa',
  '/comunidad',
  '/estudio-rrss',
  '/contable',
  '/sii',
  '/sii/rcv',
  '/sii/impuestos',
  '/banco',
  '/pagos',
  '/conciliacion',
  '/crm',
  '/crm/resenas',
  '/pipeline',
  '/configuracion',
  '/configuracion/correos',
  '/inicio',
  '/invitaciones',
  '/cuentas',
  '/operadores-feria',
  '/calendario',
  '/editor-tienda',
  '/monitor-feria',
  '/reportes',
  '/catalogo',
  '/catalogo/taxonomias',
  '/mapa',
  '/territorio',
  '/territorio/mapa',
  '/territorio/alertas',
  '/territorio/trashumancia',
  '/registro-territorial',
  '/declaracion-sag',
  '/planes-territoriales',
  '/mis-planes',
  '/reglas-comision',
  '/fenologia',
  '/fenologia/especies',
  '/creadores',
  '/microcanales',
  '/hidromiel',
  '/calculos-ia',
  '/planes-suscripcion',
  '/analisis',
  '/descuentos',
  '/club-legado',
  '/integraciones',
  '/arco',
  '/reembolsos',
  '/salud',
])

/** Rutas que viven fuera del árbol de items pero pertenecen a un módulo del sidebar */
const ROUTE_ITEM_ALIASES: Record<string, string> = {
  '/configuracion/correos': 'centro-correos',
  '/cuentas': 'invitaciones',
  '/territorio': 'territorio',
  '/territorio/mapa': 'mapa-red',
  '/territorio/alertas': 'alertas-red',
  '/territorio/trashumancia': 'trashumancia',
  '/declaracion-sag': 'declaracion-sag',
  '/registro-territorial': 'registro-comunal',
  '/planes-territoriales': 'registro-comunal',
  '/mis-planes': 'mis-planes',
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
 *
 * `apicultor` = patio (docs/ROLES_Y_ACCESO.md): inicio + colmenas + cuaderno +
 * calendario + config. No contable, no editor-tienda, no CRM, no plantaciones.
 */
/**
 * Base por platform role. Para `territorial`, la allowlist se refina con
 * `territorial_rol` (oleada 2a) vía getSidebarGroupsForRole opts.
 */
const ROLE_VISIBLE_KEYS: Record<RoleKey, readonly string[] | 'all'> = {
  admin: 'all',
  apicultor: ['inicio', 'colmenas', 'cuaderno-campo', 'ciclo-bosque', 'configuracion'],
  operador: [
    'inicio',
    'inventario',
    'lotes',
    'recoleccion',
    'envios',
    'centros-stock',
    'configuracion',
  ],
  colaborador: [
    'inicio',
    'inventario',
    'lotes',
    'configuracion',
  ],
  // Base amplia; se intersecta con TERRITORIAL_FAMILY_VISIBLE_KEYS en getSidebarGroupsForRole
  territorial: [
    'inicio',
    'colmenas',
    'cuaderno-campo',
    'ciclo-bosque',
    'territorio',
    'mapa-red',
    'alertas-red',
    'trashumancia',
    'declaracion-sag',
    'registro-comunal',
    'fenologia',
    'configuracion',
  ],
  creador: [],
  rep_ventas: [],
  cliente: [],
}

export type ShellNavOptions = {
  /** Eje B: actores_registro.rol / metadata (solo si role=territorial) */
  territorialRol?: string | null
  pathname?: string
  includeHiddenContexts?: boolean
  /** Módulos permitidos si el rol es personalizado (colaborador) */
  customModules?: readonly string[] | null
}

/**
 * Rol para la shell de navegación. Nunca elevar a admin si falta el profile
 * (loading o sesión sin rol): least privilege → menú vacío, no el panel gerencial.
 * `apicultor` es RoleKey real (no LEGACY_ROLE_MAP → admin).
 */
export function resolveShellRoleKey(raw: string | undefined | null): RoleKey {
  if (!raw) return 'cliente'
  if (raw in LEGACY_ROLE_MAP) return LEGACY_ROLE_MAP[raw]!
  if (
    raw === 'admin' ||
    raw === 'apicultor' ||
    raw === 'operador' ||
    raw === 'colaborador' ||
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
  apicultor: {},
  operador: {},
  colaborador: {},
  territorial: { territorio: '/territorio' },
  creador: {},
  rep_ventas: {},
  cliente: {},
}

const ROLE_GROUP_LABEL_OVERRIDES: Record<RoleKey, Record<string, string>> = {
  admin: {},
  apicultor: { bosque: 'TIEMPO' },
  operador: {},
  colaborador: {},
  territorial: { bosque: 'TIEMPO Y FLORACIÓN', territorio: 'RED' },
  creador: {},
  rep_ventas: {},
  cliente: {},
}

/** Labels ajustados por rol (el territorial ve 'Mi Territorio', no 'Mapa del Legado') */
const ROLE_LABEL_OVERRIDES: Record<RoleKey, Record<string, string>> = {
  admin: {},
  apicultor: { 'ciclo-bosque': 'Calendario apícola' },
  operador: {},
  colaborador: {},
  territorial: {
    colmenas: 'Colmenas',
    'cuaderno-campo': 'Cuaderno de campo',
    'ciclo-bosque': 'Calendario',
    territorio: 'Mi registro',
    'mapa-red': 'Mapa',
    'alertas-red': 'Alertas',
    trashumancia: 'Trashumancia',
    'declaracion-sag': 'Declaración SAG',
    'registro-comunal': 'Censo comunal',
    'planes-territoriales': 'Planes',
    fenologia: 'Floración',
  },
  creador: {},
  rep_ventas: {},
  cliente: {},
}

/** Tabs del bottom nav (móvil) por rol; territorial refina por sub-rol (PR5). */
export function getBottomNavKeysForRole(
  role: RoleKey,
  opts?: ShellNavOptions,
): readonly string[] {
  if (opts?.customModules && opts.customModules.length > 0) {
    return ['inicio', ...opts.customModules.filter(m => m !== 'inicio').slice(0, 3)]
  }
  if (role === 'territorial') return getTerritorialBottomNavKeys(opts?.territorialRol)
  if (role === 'apicultor') return ['inicio', 'colmenas', 'cuaderno-campo', 'ciclo-bosque']
  if (role === 'operador' || role === 'colaborador') return ['inicio', 'inventario', 'lotes', 'envios']
  if (role === 'admin') return BOTTOM_NAV_KEYS
  return ['inicio']
}

export function routeUsesViewShell(pathname: string): boolean {
  if (VIEW_SHELL_PATHS.has(pathname)) return true
  return [...VIEW_SHELL_PATHS].some(
    (path) => path !== '/' && pathname.startsWith(`${path}/`),
  )
}

/** Sin slash final (salvo `/`) para que `/territorio/` no pierda el ítem exacto. */
export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

export function findActiveItem(pathname: string): SidebarItem | undefined {
  const path = normalizePathname(pathname)
  const allItems = [...SIDEBAR_GROUPS.flatMap(g => g.items), ...ACCOUNT_ITEMS]
  const aliasKey = ROUTE_ITEM_ALIASES[path]
  if (aliasKey) {
    const aliased = allItems.find(item => item.key === aliasKey)
    if (aliased) return aliased
  }
  const exactMatch = allItems.find(item => item.href === path)
  if (exactMatch) return exactMatch
  // Sub-rutas (/colmenas/apiarios) deben resaltar su ítem propio, no el padre
  const matches = allItems
    .filter(item => item.href !== '/' && path.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)
  return matches[0]
}

/** El tab de bottom nav / fila del sheet solo se enciende si es el match más específico. */
export function isNavItemActive(pathname: string, itemKey: string): boolean {
  return findActiveItem(pathname)?.key === itemKey
}

export function getAllItems(): SidebarItem[] {
  return [...SIDEBAR_GROUPS.flatMap(g => g.items), ...ACCOUNT_ITEMS]
}

function roleCanSeeItem(
  role: RoleKey,
  itemKey: string,
  opts?: ShellNavOptions,
): boolean {
  if (opts?.customModules && opts.customModules.length > 0) {
    if (itemKey === 'inicio' || itemKey === 'configuracion') return true
    return opts.customModules.includes(itemKey)
  }
  const visible = ROLE_VISIBLE_KEYS[role] ?? []
  if (visible === 'all') return true
  if (!visible.includes(itemKey)) return false
  // Oleada 2a: territorial solo ve la intersección con su familia de sub-rol
  if (role === 'territorial') {
    return getTerritorialVisibleKeys(opts?.territorialRol).includes(itemKey)
  }
  return true
}

function sortByVisibleKeyOrder<T extends { key: string }>(
  items: T[],
  order: readonly string[],
): T[] {
  const idx = new Map(order.map((key, i) => [key, i]))
  return [...items].sort((a, b) => (idx.get(a.key) ?? 999) - (idx.get(b.key) ?? 999))
}

function minVisibleIndex(items: { key: string }[], order: readonly string[]): number {
  let min = Number.POSITIVE_INFINITY
  for (const item of items) {
    const n = order.indexOf(item.key)
    if (n >= 0 && n < min) min = n
  }
  return min
}

/** Grupos visibles para el rol, con hrefs/labels ajustados y grupos vacíos eliminados */
export function getSidebarGroupsForRole(
  role: RoleKey,
  opts?: ShellNavOptions,
): SidebarGroup[] {
  const overrides = ROLE_HREF_OVERRIDES[role] ?? {}
  const labelOverrides = ROLE_LABEL_OVERRIDES[role] ?? {}
  const groupLabelOverrides = ROLE_GROUP_LABEL_OVERRIDES[role] ?? {}
  const groups = SIDEBAR_GROUPS
    .map((group) => ({
      ...group,
      label: groupLabelOverrides[group.key] ?? group.label,
      items: group.items
        .filter((item) => roleCanSeeItem(role, item.key, opts))
        .map((item) => ({
          ...item,
          href: overrides[item.key] ? overrides[item.key] : item.href,
          label: labelOverrides[item.key] ? labelOverrides[item.key] : item.label,
        })),
    }))
    .filter((group) => group.items.length > 0)

  if (role !== 'territorial') return groups

  const keyOrder = getTerritorialVisibleKeys(opts?.territorialRol)
  const isInstitucion = opts?.territorialRol === 'institucion_publica'
  const isTecnico = opts?.territorialRol === 'tecnico_inspector'
  const feno = groups.find((g) => g.key === 'bosque')?.items.find((i) => i.key === 'fenologia')
  const cicloItem = groups.find((g) => g.key === 'vision')?.items.find((i) => i.key === 'ciclo-bosque')

  let reparented = groups
  if (cicloItem && !isInstitucion && !isTecnico) {
    reparented = reparented.map((group) => {
      if (group.key === 'vision') {
        return { ...group, items: group.items.filter((i) => i.key !== 'ciclo-bosque') }
      }
      if (group.key === 'bosque') {
        return { ...group, items: [cicloItem, ...group.items] }
      }
      return group
    })
  }

  if (feno && (!opts?.territorialRol || !opts.territorialRol.startsWith('api_'))) {
    reparented = reparented
      .map((group) => {
        if (group.key === 'bosque') {
          return { ...group, items: group.items.filter((i) => i.key !== 'fenologia') }
        }
        if (group.key === 'territorio') {
          return { ...group, items: [...group.items, feno] }
        }
        return group
      })
      .filter((group) => group.items.length > 0)
  }

  return reparented
    .map((group) => ({ ...group, items: sortByVisibleKeyOrder(group.items, keyOrder) }))
    .sort((a, b) => minVisibleIndex(a.items, keyOrder) - minVisibleIndex(b.items, keyOrder))
}

export function getAccountItemsForRole(
  role: RoleKey,
  opts?: ShellNavOptions,
): SidebarItem[] {
  return ACCOUNT_ITEMS.filter((item) => roleCanSeeItem(role, item.key, opts))
}
