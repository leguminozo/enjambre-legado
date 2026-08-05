/**
 * Configuración monetaria de plataforma (Núcleo / OYZ).
 * Hoy: CLP fijo. Mañana: leer de profiles.preferences o settings de empresa.
 */
import {
  setDefaultCurrency,
  getDefaultCurrency,
  getCurrencyDefinition,
  type CurrencyCode,
} from '@enjambre/ui';

/** Moneda predeterminada del enjambre en Chile. */
export const PLATFORM_CURRENCY: CurrencyCode = 'CLP';

/** Inicializa el default del design system al arrancar la app. */
export function initPlatformCurrency(code: CurrencyCode = PLATFORM_CURRENCY): void {
  setDefaultCurrency(code);
}

export function getPlatformCurrency(): CurrencyCode {
  return getDefaultCurrency();
}

export function getPlatformCurrencyLabel(): string {
  return getCurrencyDefinition().label;
}
