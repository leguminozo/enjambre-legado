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