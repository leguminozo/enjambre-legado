'use server';

import { createClient } from '@/utils/supabase/server';
import type { 
  GamificationProfile, 
  ImpactFootprint, 
  LoyaltyTransaction 
} from '@/lib/shop/logros-schema';

export async function getUserGamificationProfile(): Promise<GamificationProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch user tier view, dynamic configs and loyalty points from the canonical SSOT
  const [userTierRes, tierConfigsRes, puntosRows] = await Promise.all([
    supabase
      .from('user_tier_view')
      .select('tier, tier_nombre, tier_icono, tier_color_token, tier_narrativa, tier_priority, ciclos_historicos')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('guardian_tier_configs')
      .select('tier, nombre_display, icono, color_token, min_ciclos, priority, activo')
      .eq('activo', true)
      .order('priority', { ascending: true }),
    supabase
      .from('puntos_fidelizacion')
      .select('puntos_acumulados_total')
      .eq('user_id', user.id),
  ]);

  const userPoints = (puntosRows.data ?? []).reduce(
    (acc, row) => acc + (Number(row.puntos_acumulados_total) || 0),
    0,
  );

  const userTier = userTierRes.data;
  const currentTierCode = String(userTier?.tier || 'OBRERA').toUpperCase();
  const configs = (tierConfigsRes.data ?? []).filter((c) => c.activo !== false);

  const currentConfig = configs.find((c) => c.tier.toUpperCase() === currentTierCode) || configs[0];
  const currentTierName = userTier?.tier_nombre || currentConfig?.nombre_display || 'Iniciador';
  const currentPriority = currentConfig?.priority ?? 1;
  const nextConfig = configs.find((c) => c.priority > currentPriority);

  const ciclos = Number(userTier?.ciclos_historicos ?? 0);
  let nextTierPoints: number | null = null;
  let nextTierName: string | null = null;
  let progressPercentage = 0;

  if (nextConfig) {
    nextTierPoints = nextConfig.min_ciclos;
    nextTierName = nextConfig.nombre_display || nextConfig.tier;
    const threshold = nextConfig.min_ciclos;
    progressPercentage = threshold > 0 ? Math.min(100, Math.round((ciclos / threshold) * 100)) : 100;
  } else {
    progressPercentage = 100;
  }

  return {
    puntos_acumulados: userPoints,
    nivel_guardian: userTier?.tier ?? 'OBRERA',
    tier_name: currentTierName,
    next_tier_points: nextTierPoints,
    next_tier_name: nextTierName,
    progress_percentage: progressPercentage,
  };
}

export async function getUserImpactFootprint(): Promise<ImpactFootprint> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { co2_evitado_kg: 0, bosque_m2_protegido: 0, azucar_sustituida_g: 0 };
  }

  // RLS on order_regenerative_footprint ensures we only see our own footprints
  const { data: footprints } = await supabase
    .from('order_regenerative_footprint')
    .select('co2_evitado_kg, bosque_m2_protegido, azucar_sustituida_g');

  if (!footprints || footprints.length === 0) {
    return { co2_evitado_kg: 0, bosque_m2_protegido: 0, azucar_sustituida_g: 0 };
  }

  return footprints.reduce((acc, curr) => ({
    co2_evitado_kg: acc.co2_evitado_kg + Number(curr.co2_evitado_kg || 0),
    bosque_m2_protegido: acc.bosque_m2_protegido + Number(curr.bosque_m2_protegido || 0),
    azucar_sustituida_g: acc.azucar_sustituida_g + Number(curr.azucar_sustituida_g || 0),
  }), { co2_evitado_kg: 0, bosque_m2_protegido: 0, azucar_sustituida_g: 0 });
}

export async function getUserLoyaltyHistory(): Promise<LoyaltyTransaction[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: transactions } = await supabase
    .from('loyalty_transactions')
    .select('id, points, balance_after, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return transactions ?? [];
}
