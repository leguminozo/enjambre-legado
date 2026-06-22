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
};

export function computeShippingCost(input: ShippingQuoteInput): number {
  const { region, courierCode, subtotalClp, freeShipping = true } = input;

  if (courierCode === 'retiro_tienda' || courierCode === 'despacho_propio') {
    return courierCode === 'retiro_tienda' ? 0 : Math.round(getRegionShippingBase(region) * 0.85);
  }

  if (freeShipping && subtotalClp >= FREE_SHIPPING_SUBTOTAL) {
    return 0;
  }

  const base = getRegionShippingBase(region);
  const mult = COURIER_MULTIPLIER[courierCode] ?? 1.1;
  return Math.round(base * mult);
}

export { FREE_SHIPPING_SUBTOTAL };