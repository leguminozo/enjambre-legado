import type { CourierCode } from './couriers';

/** Tarifas flat por región (CLP). BlueExpress como referencia; otras modalidades ajustan. */
const REGION_BASE_RATES: Record<string, number> = {
  'Los Lagos': 4500,
  'Los Ríos': 5500,
  Metropolitana: 5900,
  'La Araucanía': 6500,
  Biobío: 6500,
  Ñuble: 7000,
  Maule: 7500,
  "O'Higgins": 7500,
  Valparaíso: 7900,
  Coquimbo: 8500,
  Atacama: 9500,
  Antofagasta: 10500,
  Tarapacá: 11500,
  'Arica y Parinacota': 12500,
  Aysén: 12500,
  Magallanes: 13500,
};

export const CHILE_REGIONES = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  "O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes',
] as const;

export type ChileRegion = (typeof CHILE_REGIONES)[number];

const DEFAULT_REGION_RATE = 7900;
const FREE_SHIPPING_SUBTOTAL = 45000;

export function getRegionShippingBase(region: string): number {
  const trimmed = region.trim();
  return REGION_BASE_RATES[trimmed] ?? DEFAULT_REGION_RATE;
}

const COURIER_MULTIPLIER: Partial<Record<CourierCode, number>> = {
  blueexpress: 1,
  chilexpress: 1.08,
  starken: 1.05,
  correos_chile: 1.02,
  retiro_tienda: 0,
  despacho_propio: 0.85,
};

export type ShippingQuoteInput = {
  region: string;
  courierCode: CourierCode;
  subtotalClp: number;
  freeShipping?: boolean;
  freeShippingSubtotal?: number;
  /**
   * Peso bruto total del pedido en gramos (vidrio + miel).
   * Opcional y backward-compatible: omitido o 0 = tarifa plana histórica.
   */
  weightGrams?: number;
};

/** Tramos de peso para miel en envase de vidrio (1 frasco 500g ≈ 800g brutos). */
const WEIGHT_TIER_MULTIPLIER: Array<{ maxGrams: number; multiplier: number }> = [
  { maxGrams: 1500, multiplier: 1 },
  { maxGrams: 3500, multiplier: 1.18 },
  { maxGrams: Number.POSITIVE_INFINITY, multiplier: 1.35 },
];

/** El despacho de cortesía cubre hasta 4 kg; sobre eso se cobra flete ajustado. */
const FREE_SHIPPING_MAX_GRAMS = 4000;

export function getWeightMultiplier(weightGrams: number): number {
  const w = Math.max(0, weightGrams);
  for (const tier of WEIGHT_TIER_MULTIPLIER) {
    if (w <= tier.maxGrams) return tier.multiplier;
  }
  return 1;
}

export function computeShippingCost(input: ShippingQuoteInput): number {
  const {
    region,
    courierCode,
    subtotalClp,
    freeShipping = true,
    freeShippingSubtotal = FREE_SHIPPING_SUBTOTAL,
    weightGrams = 0,
  } = input;

  if (courierCode === 'retiro_tienda') {
    return 0;
  }

  const weightMult = getWeightMultiplier(weightGrams);
  const hasWeight = weightGrams > 0;

  if (courierCode === 'despacho_propio') {
    return Math.round(getRegionShippingBase(region) * 0.85 * weightMult);
  }

  if (
    freeShipping &&
    subtotalClp >= freeShippingSubtotal &&
    (!hasWeight || weightGrams <= FREE_SHIPPING_MAX_GRAMS)
  ) {
    return 0;
  }

  const base = getRegionShippingBase(region);
  const mult = COURIER_MULTIPLIER[courierCode] ?? 1.1;
  return Math.round(base * mult * weightMult);
}

export { FREE_SHIPPING_SUBTOTAL };