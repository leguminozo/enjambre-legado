import { WHOLESALE_COMMERCIAL_RULES } from '@enjambre/pricing';
import type { SegmentKit } from './segment-content';

export interface B2BOnboardingPricing {
  subtotalNeto: number;
  iva: number;
  totalFacturable: number;
}

export function resolveB2BOnboardingPricing(kit: SegmentKit | undefined): B2BOnboardingPricing | null {
  if (!kit || !Number.isSafeInteger(kit.precioNetoClp) || kit.precioNetoClp <= 0) {
    return null;
  }

  const subtotalNeto = kit.precioNetoClp;
  const iva = Math.round(subtotalNeto * WHOLESALE_COMMERCIAL_RULES.tasaIvaChile);

  return {
    subtotalNeto,
    iva,
    totalFacturable: subtotalNeto + iva,
  };
}
