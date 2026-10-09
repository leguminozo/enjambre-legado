import type { SupabaseClient } from '@supabase/supabase-js';
import { getEcosystemMetrics, type EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';
import { toTiendaUserProfile } from '@/lib/shop/user-profile';

export type GuardianTierProgress = {
  current_tier: string;
  tier_override: string | null;
  metrics: {
    ciclos: number;
    spent: number;
    referrals: number;
    trees: number;
  };
  next_tier: string | null;
  thresholds: {
    ciclos: number;
    spent: number;
    trees: number;
    referrals: number;
  };
  progress: {
    ciclos: number;
    spent: number;
    trees: number;
    referrals: number;
    overall: number;
  };
};

export type GuardianImpactData = {
  co2_evitado_kg: number;
  bosque_m2_protegido: number;
  azucar_sustituida_g: number;
  irr_score: number | null;
  arboles_plantados: number;
  especies_arboles: string[];
  ciclos_historicos: number;
  calculado_en: string;
};

export type GuardianStampProgress = {
  program_id: string;
  nombre: string;
  unidades_requeridas: number;
  unidades_acumuladas: number;
  unidades_canjeadas: number;
  producto_id: string | null;
  producto_nombre: string | null;
};

export type GuardianReferralData = {
  referral_code: string | null;
  referidos_capturados: number;
  puntos_referidos: number;
};

export type GuardianDashboardData = {
  user: TiendaUserProfile | null;
  tierData: GuardianTierProgress | null;
  impactData: GuardianImpactData | null;
  stampProgress: GuardianStampProgress[];
  referralData: GuardianReferralData | null;
  orders: Array<{
    id: string;
    created_at: string;
    total: number;
    estado: string;
    productos: Array<{ nombre: string; cantidad: number; precio: number }>;
  }>;
  ecosystemMetrics: EcosystemMetrics;
};

async function fetchImpactData(supabase: SupabaseClient, userId: string): Promise<GuardianImpactData | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_impact_footprint', { p_user_id: userId });
    if (error) {
      console.error('[guardian-dashboard] RPC get_user_impact_footprint failed:', error.message);
      return null;
    }
    return data as GuardianImpactData;
  } catch (e) {
    console.error('[guardian-dashboard] fetchImpactData error:', e);
    return null;
  }
}

async function fetchTierProgress(supabase: SupabaseClient, userId: string): Promise<GuardianTierProgress | null> {
  try {
    const { data, error } = await supabase.rpc('tier_progress_cliente', { p_user_id: userId });
    if (error) {
      console.error('[guardian-dashboard] RPC tier_progress_cliente failed:', error.message);
      return null;
    }
    return data as GuardianTierProgress;
  } catch (e) {
    console.error('[guardian-dashboard] fetchTierProgress error:', e);
    return null;
  }
}

async function fetchStampProgress(supabase: SupabaseClient, userId: string): Promise<GuardianStampProgress[]> {
  try {
    const { data, error } = await supabase
      .from('guardian_stamp_progress')
      .select(
        `
        unidades_acumuladas,
        unidades_canjeadas,
        guardian_stamp_programs!inner (
          id,
          nombre,
          unidades_requeridas,
          producto_id,
          productos!inner (nombre)
        )
      `,
      )
      .eq('user_id', userId);

    if (error) {
      console.error('[guardian-dashboard] fetchStampProgress error:', error.message);
      return [];
    }

    type StampProgressRow = {
      unidades_acumuladas: number;
      unidades_canjeadas: number;
      guardian_stamp_programs: Array<{
        id: string;
        nombre: string;
        unidades_requeridas: number;
        producto_id: string | null;
        productos: Array<{ nombre: string }>;
      }>;
    };

    return ((data ?? []) as StampProgressRow[]).map((row) => {
      const program = row.guardian_stamp_programs[0];
      return {
        program_id: program.id,
        nombre: program.nombre,
        unidades_requeridas: program.unidades_requeridas,
        unidades_acumuladas: row.unidades_acumuladas,
        unidades_canjeadas: row.unidades_canjeadas,
        producto_id: program.producto_id,
        producto_nombre: program.productos[0]?.nombre ?? null,
      };
    });
  } catch (e) {
    console.error('[guardian-dashboard] fetchStampProgress error:', e);
    return [];
  }
}

async function fetchReferralData(supabase: SupabaseClient, userId: string): Promise<GuardianReferralData | null> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .maybeSingle();

    const { data: referidos } = await supabase
      .from('profiles')
      .select('id, referral_code')
      .eq('referred_by', userId);

    const { data: trans } = await supabase
      .from('loyalty_transactions')
      .select('points')
      .eq('action_type', 'referido')
      .eq('user_id', userId);

    const puntosReferidos = (trans ?? []).reduce((sum, t) => sum + (t.points || 0), 0);

    return {
      referral_code: profile?.referral_code ?? null,
      referidos_capturados: referidos?.length ?? 0,
      puntos_referidos: puntosReferidos,
    };
  } catch (e) {
    console.error('[guardian-dashboard] fetchReferralData error:', e);
    return { referral_code: null, referidos_capturados: 0, puntos_referidos: 0 };
  }
}

async function fetchRecentOrders(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from('ventas')
    .select('id, created_at, total, estado, productos')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  return (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    total: row.total,
    estado: row.estado,
    productos: Array.isArray(row.productos)
      ? (row.productos as Array<{ nombre?: string; name?: string; cantidad?: number; quantity?: number; precio?: number; price?: number }>).map((p) => ({
          nombre: p.nombre ?? p.name ?? 'Producto',
          cantidad: p.cantidad ?? p.quantity ?? 1,
          precio: p.precio ?? p.price ?? 0,
        }))
      : [],
  }));
}

export async function loadGuardianDashboard(
  supabase: SupabaseClient,
  userId: string,
): Promise<Omit<GuardianDashboardData, 'ecosystemMetrics'>> {
  const [profileRes, tierRes, impactRes, stampRes, referralRes, ordersRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    fetchTierProgress(supabase, userId),
    fetchImpactData(supabase, userId),
    fetchStampProgress(supabase, userId),
    fetchReferralData(supabase, userId),
    fetchRecentOrders(supabase, userId),
  ]);

  return {
    user: toTiendaUserProfile(
      profileRes.data
        ? { ...profileRes.data, id: userId }
        : { id: userId, full_name: null, email: null, role: null, arboles_personal: null, avatar_url: null },
    ),
    tierData: tierRes,
    impactData: impactRes,
    stampProgress: stampRes,
    referralData: referralRes,
    orders: ordersRes,
  };
}