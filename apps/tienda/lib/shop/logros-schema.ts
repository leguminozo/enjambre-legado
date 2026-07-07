export type LoyaltyTierKey = 'polinizador' | 'apicultor' | 'guardian' | string;
export type RewardStatus = 'pending' | 'fulfilled' | 'expired';

export interface GamificationProfile {
  puntos_acumulados: number;
  nivel_guardian: LoyaltyTierKey | null;
  tier_name: string;
  next_tier_points: number | null;
  next_tier_name: string | null;
  progress_percentage: number;
}

export interface ImpactFootprint {
  co2_evitado_kg: number;
  bosque_m2_protegido: number;
  azucar_sustituida_g: number;
}

export interface LoyaltyTransaction {
  id: string;
  points: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}
