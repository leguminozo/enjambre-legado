export const GUARDIAN_TIER_THRESHOLDS = [
  { minCiclos: 5000, tier: 'COLMENA' },
  { minCiclos: 2000, tier: 'REINA' },
  { minCiclos: 500, tier: 'ZÁNGANO' },
  { minCiclos: 0, tier: 'OBRERA' },
] as const;

export type GuardianTier = (typeof GUARDIAN_TIER_THRESHOLDS)[number]['tier'] | string;

export const LOYALTY_NIVEL_LABELS: Record<string, string> = {
  bronze: 'Bronce',
  silver: 'Plata',
  gold: 'Oro',
  platinum: 'Platino',
};

export interface GuardianTierThreshold {
  minCiclos: number;
  tier: string;
  nombre?: string;
  icono?: string;
}

export function computeGuardianTier(
  ciclosHistoricos: number,
  thresholds: readonly GuardianTierThreshold[] = GUARDIAN_TIER_THRESHOLDS,
): GuardianTier {
  const sorted = [...thresholds].sort((a, b) => b.minCiclos - a.minCiclos);
  for (const row of sorted) {
    if (ciclosHistoricos >= row.minCiclos) return row.tier;
  }
  return thresholds[thresholds.length - 1]?.tier ?? 'OBRERA';
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
  tierNombre?: string;
  tierIcono?: string;
};

export function buildUnifiedTierDisplay(input: {
  ciclosHistoricos?: number | null;
  loyaltyNivel?: string | null;
  guardianTier?: string | null;
  tierNombre?: string | null;
  tierIcono?: string | null;
  thresholds?: readonly GuardianTierThreshold[];
}): UnifiedTierDisplay {
  const guardianCiclos = Math.max(0, input.ciclosHistoricos ?? 0);
  const loyaltyNivel = normalizeLoyaltyNivel(input.loyaltyNivel);
  const resolvedTier = input.guardianTier || computeGuardianTier(guardianCiclos, input.thresholds);

  return {
    guardianTier: resolvedTier,
    guardianCiclos,
    loyaltyNivel,
    loyaltyLabel: formatLoyaltyNivel(loyaltyNivel),
    tierNombre: input.tierNombre ?? undefined,
    tierIcono: input.tierIcono ?? undefined,
  };
}