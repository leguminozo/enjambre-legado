import { isCourierCode, type CourierCode } from './couriers';

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

export function getRegionShippingBase(region: string): number {
  const trimmed = region.trim();
  return REGION_BASE_RATES[trimmed] ?? DEFAULT_REGION_RATE;
}

export function getWeightMultiplier(weightGrams: number): number {
  const w = Math.max(0, weightGrams);
  for (const tier of WEIGHT_TIER_MULTIPLIER) {
    if (w <= tier.maxGrams) return tier.multiplier;
  }
  return 1;
}

// ── Config editable vía CMS (site_content → shipping_settings) ─────────────

export type ShippingRegionRate = {
  region: string;
  baseClp: number;
};

export type ShippingWeightTier = {
  /** Gramos brutos máximos del tramo; null = tramo final sin límite. */
  maxGrams: number | null;
  multiplier: number;
};

export type ShippingRatesConfig = {
  regionRates: ShippingRegionRate[];
  defaultRegionRateClp: number;
  courierMultipliers: Record<string, number>;
  unknownCourierMultiplier: number;
  despachoPropioMultiplier: number;
  freeShippingMaxGrams: number;
  weightTiers: ShippingWeightTier[];
};

export const DEFAULT_SHIPPING_RATES_CONFIG: ShippingRatesConfig = {
  regionRates: CHILE_REGIONES.map((region) => ({
    region,
    baseClp: REGION_BASE_RATES[region] ?? DEFAULT_REGION_RATE,
  })),
  defaultRegionRateClp: DEFAULT_REGION_RATE,
  courierMultipliers: { ...COURIER_MULTIPLIER },
  unknownCourierMultiplier: 1.1,
  despachoPropioMultiplier: COURIER_MULTIPLIER.despacho_propio ?? 0.85,
  freeShippingMaxGrams: FREE_SHIPPING_MAX_GRAMS,
  weightTiers: WEIGHT_TIER_MULTIPLIER.map((t) => ({
    maxGrams: Number.isFinite(t.maxGrams) ? t.maxGrams : null,
    multiplier: t.multiplier,
  })),
};

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Sanea el JSON crudo del CMS a una configuración completa. Campo inválido o
 * ausente = valor base del código, nunca NaN: un error del operador no puede
 * romper el cobro del despacho.
 */
export function shippingRatesConfigFromRaw(
  raw: Record<string, unknown> | null | undefined,
): ShippingRatesConfig {
  const d = DEFAULT_SHIPPING_RATES_CONFIG;
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

  const defaultsByRegion = new Map(d.regionRates.map((r) => [r.region, r.baseClp]));
  const providedRates = new Map<string, number>();
  if (Array.isArray(src.regionRates)) {
    for (const item of src.regionRates) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const obj = item as Record<string, unknown>;
      const region = typeof obj.region === 'string' ? obj.region.trim() : '';
      if (!region || !isNonNegativeNumber(obj.baseClp)) continue;
      providedRates.set(region, Math.round(obj.baseClp));
    }
  }
  const regionRates = d.regionRates.map((r) => ({
    region: r.region,
    baseClp: providedRates.get(r.region) ?? defaultsByRegion.get(r.region) ?? d.defaultRegionRateClp,
  }));

  const courierMultipliers: Record<string, number> = { ...d.courierMultipliers };
  if (src.courierMultipliers && typeof src.courierMultipliers === 'object' && !Array.isArray(src.courierMultipliers)) {
    for (const [code, value] of Object.entries(src.courierMultipliers as Record<string, unknown>)) {
      if (!isCourierCode(code) || !isNonNegativeNumber(value)) continue;
      courierMultipliers[code] = value;
    }
  }

  const weightTiers: ShippingWeightTier[] = [];
  if (Array.isArray(src.weightTiers)) {
    for (const item of src.weightTiers) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const obj = item as Record<string, unknown>;
      if (!isNonNegativeNumber(obj.multiplier)) continue;
      if (obj.maxGrams === null) {
        weightTiers.push({ maxGrams: null, multiplier: obj.multiplier });
      } else if (isNonNegativeNumber(obj.maxGrams)) {
        weightTiers.push({ maxGrams: Math.round(obj.maxGrams), multiplier: obj.multiplier });
      }
    }
  }
  if (weightTiers.length === 0) {
    weightTiers.push(...d.weightTiers.map((t) => ({ ...t })));
  }
  weightTiers.sort((a, b) => (a.maxGrams ?? Number.POSITIVE_INFINITY) - (b.maxGrams ?? Number.POSITIVE_INFINITY));

  return {
    regionRates,
    defaultRegionRateClp: isNonNegativeNumber(src.defaultRegionRateClp)
      ? Math.round(src.defaultRegionRateClp)
      : d.defaultRegionRateClp,
    courierMultipliers,
    unknownCourierMultiplier:
      typeof src.unknownCourierMultiplier === 'number' &&
      Number.isFinite(src.unknownCourierMultiplier) &&
      src.unknownCourierMultiplier > 0
        ? src.unknownCourierMultiplier
        : d.unknownCourierMultiplier,
    despachoPropioMultiplier: isNonNegativeNumber(src.despachoPropioMultiplier)
      ? src.despachoPropioMultiplier
      : d.despachoPropioMultiplier,
    freeShippingMaxGrams: isNonNegativeNumber(src.freeShippingMaxGrams)
      ? Math.round(src.freeShippingMaxGrams)
      : d.freeShippingMaxGrams,
    weightTiers,
  };
}

function weightMultiplierFromTiers(
  weightGrams: number,
  tiers: readonly ShippingWeightTier[],
): number {
  const w = Math.max(0, weightGrams);
  for (const tier of tiers) {
    if (tier.maxGrams === null || w <= tier.maxGrams) return tier.multiplier;
  }
  return 1;
}

function regionBaseFromRates(region: string, config: ShippingRatesConfig): number {
  const trimmed = region.trim();
  const match = config.regionRates.find((r) => r.region === trimmed);
  return match ? match.baseClp : config.defaultRegionRateClp;
}

export function computeShippingCostWithRates(
  input: ShippingQuoteInput,
  config: ShippingRatesConfig = DEFAULT_SHIPPING_RATES_CONFIG,
): number {
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

  const weightMult = weightMultiplierFromTiers(weightGrams, config.weightTiers);
  const hasWeight = weightGrams > 0;

  if (courierCode === 'despacho_propio') {
    return Math.round(regionBaseFromRates(region, config) * config.despachoPropioMultiplier * weightMult);
  }

  if (
    freeShipping &&
    subtotalClp >= freeShippingSubtotal &&
    (!hasWeight || weightGrams <= config.freeShippingMaxGrams)
  ) {
    return 0;
  }

  const base = regionBaseFromRates(region, config);
  const mult = config.courierMultipliers[courierCode] ?? config.unknownCourierMultiplier;
  return Math.round(base * mult * weightMult);
}

export function computeShippingCost(input: ShippingQuoteInput): number {
  return computeShippingCostWithRates(input);
}

export { FREE_SHIPPING_SUBTOTAL };
