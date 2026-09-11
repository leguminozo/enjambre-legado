import { describe, it, expect } from 'vitest';
import {
  buildUnifiedTierDisplay,
  computeGuardianTier,
  normalizeLoyaltyNivel,
} from '../guardian-tier';

describe('computeGuardianTier', () => {
  it('asigna OBRERA por defecto', () => {
    expect(computeGuardianTier(0)).toBe('OBRERA');
    expect(computeGuardianTier(499)).toBe('OBRERA');
  });

  it('sube a ZÁNGANO con 500 ciclos', () => {
    expect(computeGuardianTier(500)).toBe('ZÁNGANO');
  });

  it('permite umbrales dinámicos configurados desde BD', () => {
    const customThresholds = [
      { minCiclos: 10000, tier: 'COLMENA' as const },
      { minCiclos: 4000, tier: 'REINA' as const },
      { minCiclos: 1000, tier: 'ZÁNGANO' as const },
      { minCiclos: 0, tier: 'OBRERA' as const },
    ];
    expect(computeGuardianTier(500, customThresholds)).toBe('OBRERA');
    expect(computeGuardianTier(1500, customThresholds)).toBe('ZÁNGANO');
    expect(computeGuardianTier(4500, customThresholds)).toBe('REINA');
  });
});

describe('normalizeLoyaltyNivel', () => {
  it('corrige polinizador legacy', () => {
    expect(normalizeLoyaltyNivel('polinizador')).toBe('bronze');
  });
});

describe('buildUnifiedTierDisplay', () => {
  it('combina guardian y loyalty', () => {
    const d = buildUnifiedTierDisplay({ ciclosHistoricos: 1200, loyaltyNivel: 'silver' });
    expect(d.guardianTier).toBe('ZÁNGANO');
    expect(d.loyaltyLabel).toBe('Plata');
  });
});