export const GUARDIAN_TIER_THRESHOLDS = [
  { minCiclos: 5000, tier: 'COLMENA' },
  { minCiclos: 2000, tier: 'REINA' },
  { minCiclos: 500, tier: 'ZÁNGANO' },
  { minCiclos: 0, tier: 'OBRERA' },
] as const;

export type GuardianTier = (typeof GUARDIAN_TIER_THRESHOLDS)[number]['tier'];

export const LOYALTY_NIVEL_LABELS: Record<string, string> = {
  bronze: 'Bronce',
  silver: 'Plata',
  gold: 'Oro',
  platinum: 'Platino',
};

export function computeGuardianTier(ciclosHistoricos: number): GuardianTier {
  for (const row of GUARDIAN_TIER_THRESHOLDS) {
    if (ciclosHistoricos >= row.minCiclos) return row.tier;
  }
  return 'OBRERA';
}

export function formatLoyaltyNivel(nivel: string | null | undefined): string {
  if (!nivel) return LOYALTY_NIVEL_LABELS.bronze;
  const key = nivel.toLowerCase();
  return LOYALTY_NIVEL_LABELS[key] ?? nivel;
}

export function normalizeLoyaltyNivel(nivel: string | null | undefined): string {
  if (!nivel) return 'bronze';
  const key = nivel.toLowerCase();
  if (key in LOYALTY_NIVEL_LABELS) return key;
  if (key === 'polinizador') return 'bronze';
  return 'bronze';
}

export type UnifiedTierDisplay = {
  guardianTier: GuardianTier;
  guardianCiclos: number;
  loyaltyNivel: string;
  loyaltyLabel: string;
};

export function buildUnifiedTierDisplay(input: {
  ciclosHistoricos?: number | null;
  loyaltyNivel?: string | null;
}): UnifiedTierDisplay {
  const guardianCiclos = Math.max(0, input.ciclosHistoricos ?? 0);
  const loyaltyNivel = normalizeLoyaltyNivel(input.loyaltyNivel);
  return {
    guardianTier: computeGuardianTier(guardianCiclos),
    guardianCiclos,
    loyaltyNivel,
    loyaltyLabel: formatLoyaltyNivel(loyaltyNivel),
  };
}