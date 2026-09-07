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

  // 1. Fetch user profile for tier key
  const { data: profile } = await supabase
    .from('profiles')
    .select('nivel_guardian')
    .eq('id', user.id)
    .maybeSingle();

  // El progreso se alimenta del saldo VIVO (puntos_fidelizacion), no del saldo
  // legacy profiles.puntos_acumulados (solo los referidos lo tocaban y las
  // compras reales nunca avanzaban el nivel). Suma por si hay más de una
  // empresa.
  const { data: puntosRows } = await supabase
    .from('puntos_fidelizacion')
    .select('puntos_acumulados_total')
    .eq('user_id', user.id);

  const userPoints = (puntosRows ?? []).reduce(
    (acc, row) => acc + (Number(row.puntos_acumulados_total) || 0),
    0,
  );
  
  // 2. Fetch all tiers to calculate progress
  const { data: tiers } = await supabase
    .from('loyalty_tiers')
    .select('*')
    .order('min_points', { ascending: true });

  let currentTierName = 'Obrera';
  let nextTierPoints: number | null = 100;
  let nextTierName: string | null = 'Zángano';
  let progressPercentage = 0;

  if (tiers && tiers.length > 0) {
    // El nivel se deriva del saldo vivo (nivel_guardian legacy quedó atado al
    // saldo muerto profiles.puntos_acumulados y no refleja las compras).
    const currentTier = [...tiers].reverse().find(t => userPoints >= t.min_points)
      ?? tiers[0];
      
    currentTierName = currentTier.name;

    // Find next tier
    const nextTier = tiers.find(t => t.min_points > userPoints);
    if (nextTier) {
      nextTierPoints = nextTier.min_points;
      nextTierName = nextTier.name;
      
      const prevTierPoints = currentTier.min_points;
      const range = nextTier.min_points - prevTierPoints;
      const progress = userPoints - prevTierPoints;
      progressPercentage = range > 0 ? Math.max(0, Math.min(100, Math.round((progress / range) * 100))) : 0;
    } else {
      nextTierPoints = null;
      nextTierName = null;
      progressPercentage = 100;
    }
  }

  return {
    puntos_acumulados: userPoints,
    nivel_guardian: profile?.nivel_guardian ?? 'obrera',
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
