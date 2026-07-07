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

  // 1. Fetch user profile for points and tier key
  const { data: profile } = await supabase
    .from('profiles')
    .select('puntos_acumulados, nivel_guardian')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  const userPoints = profile.puntos_acumulados ?? 0;
  
  // 2. Fetch all tiers to calculate progress
  const { data: tiers } = await supabase
    .from('loyalty_tiers')
    .select('*')
    .order('min_points', { ascending: true });

  let currentTierName = 'Recién llegado';
  let nextTierPoints: number | null = null;
  let nextTierName: string | null = null;
  let progressPercentage = 100;

  if (tiers && tiers.length > 0) {
    // Find current tier
    const currentTier = tiers.find(t => t.key === profile.nivel_guardian) 
      ?? [...tiers].reverse().find(t => userPoints >= t.min_points)
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
      progressPercentage = Math.max(0, Math.min(100, Math.round((progress / range) * 100)));
    }
  }

  return {
    puntos_acumulados: userPoints,
    nivel_guardian: profile.nivel_guardian,
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
