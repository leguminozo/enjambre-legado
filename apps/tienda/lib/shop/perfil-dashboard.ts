import type { SupabaseClient } from '@supabase/supabase-js';
import { getEcosystemMetrics, type EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';
import { toTiendaUserProfile } from '@/lib/shop/user-profile';
import { getSiteContentBatch } from '@/lib/cms';
import {
  parsePerfilInicioSettings,
  parsePerfilTrazabilidadSettings,
  parsePerfilPedidosSettings,
  parsePerfilSuscripcionesSettings,
  parsePerfilResenasSettings,
  parsePerfilRetornoSettings,
  parsePerfilBilleteraSettings,
  DEFAULT_PERFIL_INICIO_SETTINGS,
  DEFAULT_PERFIL_TRAZABILIDAD_SETTINGS,
  DEFAULT_PERFIL_PEDIDOS_SETTINGS,
  DEFAULT_PERFIL_SUSCRIPCIONES_SETTINGS,
  DEFAULT_PERFIL_RESENAS_SETTINGS,
  DEFAULT_PERFIL_RETORNO_SETTINGS,
  DEFAULT_PERFIL_BILLETERA_SETTINGS,
} from '@enjambre/shop-chrome';

export type PerfilOrderItem = {
  cantidad: number;
  productos: {
    nombre: string;
    precio: number;
  };
};

export type PerfilRecentOrder = {
  id: string;
  created_at: string;
  total: number;
  estado: string;
  pedido_items: PerfilOrderItem[];
};

export type PerfilClaimPoint = {
  id: string;
  ciclos: {
    tipo: string;
    estado: string;
  };
};

export type PerfilDashboardData = {
  user: TiendaUserProfile | null;
  tierData: { tier: string; ciclos_historicos: number } | null;
  hiveData: { name: string; estado: string; peso_kg: number } | null;
  orders: PerfilRecentOrder[];
  claimPoints: PerfilClaimPoint[];
  ecosystemMetrics: EcosystemMetrics;
  stats?: {
    totalOrders: number;
    totalSpent: number;
  };
  hasAddress?: boolean;
  hasSubscription?: boolean;
  pointsBalance?: number;
  cmsInicio?: ReturnType<typeof parsePerfilInicioSettings>;
  cmsTrazabilidad?: ReturnType<typeof parsePerfilTrazabilidadSettings>;
  cmsPedidos?: ReturnType<typeof parsePerfilPedidosSettings>;
  cmsSuscripciones?: ReturnType<typeof parsePerfilSuscripcionesSettings>;
  cmsResenas?: ReturnType<typeof parsePerfilResenasSettings>;
  cmsRetorno?: ReturnType<typeof parsePerfilRetornoSettings>;
  cmsBilletera?: ReturnType<typeof parsePerfilBilleteraSettings>;
};

type VentaProductoJson = {
  nombre?: string;
  name?: string;
  cantidad?: number;
  quantity?: number;
  precio?: number;
  price?: number;
};

function mapVentasToOrders(
  rows: Array<{
    id: string;
    created_at: string | null;
    fecha: string | null;
    total: number;
    estado: string | null;
    productos: unknown;
  }>,
): PerfilRecentOrder[] {
  return rows.map((row) => {
    const rawItems = Array.isArray(row.productos) ? (row.productos as VentaProductoJson[]) : [];
    const pedido_items: PerfilOrderItem[] = rawItems.map((item) => ({
      cantidad: item.cantidad ?? item.quantity ?? 1,
      productos: {
        nombre: item.nombre ?? item.name ?? 'Producto',
        precio: item.precio ?? item.price ?? 0,
      },
    }));

    return {
      id: row.id,
      created_at: row.created_at ?? row.fecha ?? new Date().toISOString(),
      total: row.total ?? 0,
      estado: row.estado ?? 'procesando',
      pedido_items,
    };
  });
}

export async function loadPerfilDashboard(
  supabase: SupabaseClient,
  userId: string,
): Promise<PerfilDashboardData> {
  const [
    profileRes,
    tierRes,
    subConfigRes,
    ordersRes,
    salesStatsRes,
    ciclosRes,
    ecosystemMetrics,
    pointsRes,
    addressCountRes,
    activeSubRes,
    cmsBatch,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_tier_view').select('tier, ciclos_historicos').eq('user_id', userId).maybeSingle(),
    supabase
      .from('suscriptor_config')
      .select('*, colmenas(name, health, production_total)')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('ventas')
      .select('id, created_at, fecha, total, estado, productos')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('ventas')
      .select('total', { count: 'exact' })
      .eq('user_id', userId)
      .limit(100),
    supabase
      .from('ciclos')
      .select('id, tipo, cantidad, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    getEcosystemMetrics(),
    supabase
      .from('puntos_fidelizacion')
      .select('puntos')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('cliente_direcciones')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1),
    getSiteContentBatch([
      'perfil_inicio_settings',
      'perfil_trazabilidad_settings',
      'perfil_pedidos_settings',
      'perfil_suscripciones_settings',
      'perfil_resenas_settings',
      'perfil_retorno_settings',
      'perfil_billetera_settings',
    ]),
  ]);

  const rawSales = (salesStatsRes?.data ?? []) as Array<{ total?: number | string | null }>;
  const totalOrders = salesStatsRes?.count ?? rawSales.length ?? (ordersRes?.data?.length ?? 0);
  const totalSpent = rawSales.reduce((sum, v) => sum + (Number(v.total) || 0), 0);

  const hive = subConfigRes.data?.colmenas as
    | { name?: string; health?: string; production_total?: number }
    | null
    | undefined;

  const hiveData =
    hive?.name && hive.health
      ? {
          name: hive.name,
          estado: hive.health,
          peso_kg: hive.production_total ?? 0,
        }
      : null;

  const tierData = tierRes.data
    ? {
        tier: tierRes.data.tier,
        ciclos_historicos: tierRes.data.ciclos_historicos ?? 0,
      }
    : null;

  const claimPoints: PerfilClaimPoint[] = (ciclosRes.data ?? []).map((ciclo) => ({
    id: ciclo.id,
    ciclos: {
      tipo: String(ciclo.tipo ?? 'ciclo'),
      estado: 'activo',
    },
  }));

  const cmsInicio = cmsBatch?.perfil_inicio_settings?.[0]
    ? parsePerfilInicioSettings(cmsBatch.perfil_inicio_settings[0].content as Record<string, unknown>)
    : DEFAULT_PERFIL_INICIO_SETTINGS;
  const cmsTrazabilidad = cmsBatch?.perfil_trazabilidad_settings?.[0]
    ? parsePerfilTrazabilidadSettings(cmsBatch.perfil_trazabilidad_settings[0].content as Record<string, unknown>)
    : DEFAULT_PERFIL_TRAZABILIDAD_SETTINGS;
  const cmsPedidos = cmsBatch?.perfil_pedidos_settings?.[0]
    ? parsePerfilPedidosSettings(cmsBatch.perfil_pedidos_settings[0].content as Record<string, unknown>)
    : DEFAULT_PERFIL_PEDIDOS_SETTINGS;
  const cmsSuscripciones = cmsBatch?.perfil_suscripciones_settings?.[0]
    ? parsePerfilSuscripcionesSettings(cmsBatch.perfil_suscripciones_settings[0].content as Record<string, unknown>)
    : DEFAULT_PERFIL_SUSCRIPCIONES_SETTINGS;
  const cmsResenas = cmsBatch?.perfil_resenas_settings?.[0]
    ? parsePerfilResenasSettings(cmsBatch.perfil_resenas_settings[0].content as Record<string, unknown>)
    : DEFAULT_PERFIL_RESENAS_SETTINGS;
  const cmsRetorno = cmsBatch?.perfil_retorno_settings?.[0]
    ? parsePerfilRetornoSettings(cmsBatch.perfil_retorno_settings[0].content as Record<string, unknown>)
    : DEFAULT_PERFIL_RETORNO_SETTINGS;
  const cmsBilletera = cmsBatch?.perfil_billetera_settings?.[0]
    ? parsePerfilBilleteraSettings(cmsBatch.perfil_billetera_settings[0].content as Record<string, unknown>)
    : DEFAULT_PERFIL_BILLETERA_SETTINGS;

  return {
    user: toTiendaUserProfile(
      profileRes.data
        ? { ...profileRes.data, id: userId }
        : { id: userId, full_name: null, email: null, role: null, arboles_personal: null, avatar_url: null },
    ),
    tierData,
    hiveData,
    orders: mapVentasToOrders(ordersRes.data ?? []),
    claimPoints,
    ecosystemMetrics,
    stats: {
      totalOrders,
      totalSpent,
    },
    hasAddress: (addressCountRes?.count ?? 0) > 0,
    hasSubscription: (activeSubRes?.data?.length ?? 0) > 0,
    pointsBalance: pointsRes?.data?.puntos ?? 0,
    cmsInicio,
    cmsTrazabilidad,
    cmsPedidos,
    cmsSuscripciones,
    cmsResenas,
    cmsRetorno,
    cmsBilletera,
  };
}