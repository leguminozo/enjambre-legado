import { describe, expect, it } from 'vitest';
import type { SegmentKit } from './segment-content';
import { resolveB2BOnboardingPricing } from './onboarding-pricing';

const kit: SegmentKit = {
  id: 'kit-prueba',
  nombre: 'Kit prueba',
  badge: 'Entrada',
  tier: 'entrada',
  tagline: 'Prueba',
  descripcion: 'Kit de prueba',
  precioNetoClp: 100_000,
  pvpEstimadoClp: 150_000,
  margenEstimadoPct: 20,
  moqSummary: '1 unidad',
  componentesFisicos: [],
  materialesExhibicion: [],
  integracionesDigitales: [],
  recomendadoPara: 'Pruebas',
};

describe('resolveB2BOnboardingPricing', () => {
  it('calcula IVA y total desde el kit canónico', () => {
    expect(resolveB2BOnboardingPricing(kit)).toEqual({
      subtotalNeto: 100_000,
      iva: 19_000,
      totalFacturable: 119_000,
    });
  });

  it('rechaza kits inexistentes o con precios inválidos', () => {
    expect(resolveB2BOnboardingPricing(undefined)).toBeNull();
    expect(resolveB2BOnboardingPricing({ ...kit, precioNetoClp: 0 })).toBeNull();
    expect(resolveB2BOnboardingPricing({ ...kit, precioNetoClp: 12.5 })).toBeNull();
  });
});
