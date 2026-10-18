import { describe, it, expect } from 'vitest';
import { MiLegadoClient } from './mi-legado-client';
import { getDemoDashboardData } from '@/lib/shop/demo-perfil-data';

describe('MiLegadoClient', () => {
  it('exporta la función de componente nombrado MiLegadoClient', () => {
    expect(typeof MiLegadoClient).toBe('function');
  });

  it('getDemoDashboardData provee tiers dinámicos completos con SSOT enriquecido', () => {
    const data = getDemoDashboardData();
    expect(data.tierData).toBeDefined();
    expect(data.tierData?.tier_nombre).toBe('Guardián Legado');
    expect(data.tierData?.tier_icono).toBe('🏛️');
    expect(data.tierData?.tier_narrativa).toContain('alianza territorial');
    expect(data.tierConfigs).toBeDefined();
    expect(data.tierConfigs?.length).toBeGreaterThanOrEqual(4);
    expect(data.tierConfigs?.[0]?.nombre_display).toBe('Iniciador');
    expect(data.tierConfigs?.[1]?.nombre_display).toBe('Aliado del Enjambre');
    expect(data.tierConfigs?.[2]?.nombre_display).toBe('Círculo de la Reina');
    expect(data.tierConfigs?.[3]?.nombre_display).toBe('Guardián Legado');
  });
});
