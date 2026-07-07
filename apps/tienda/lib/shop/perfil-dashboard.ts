import type { SupabaseClient } from '@supabase/supabase-js';
import { getEcosystemMetrics, type EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';
import { toTiendaUserProfile } from '@/lib/shop/user-profile';

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
  const [profileRes, tierRes, subConfigRes, ordersRes, ciclosRes, ecosystemMetrics] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_tier_view').select('tier, ciclos_historicos').eq('user_id', userId).maybeSingle(),
      supabase
        .from('suscriptor_config')
        .select('*, colmenas(name, estado, peso_kg)')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('ventas')
        .select('id, created_at, fecha, total, estado, productos')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('ciclos')
        .select('id, tipo, cantidad, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
      getEcosystemMetrics(),
    ]);

  const hive = subConfigRes.data?.colmenas as
    | { name?: string; estado?: string; peso_kg?: number }
    | null
    | undefined;

  const hiveData =
    hive?.name && hive.estado
      ? {
          name: hive.name,
          estado: hive.estado,
          peso_kg: hive.peso_kg ?? 0,
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

  return {
    user: toTiendaUserProfile(
      profileRes.data
        ? { ...profileRes.data, id: userId }
        : { id: userId, full_name: null, email: null, role: null, arboles_personal: null },
    ),
    tierData,
    hiveData,
    orders: mapVentasToOrders(ordersRes.data ?? []),
    claimPoints,
    ecosystemMetrics,
  };
}