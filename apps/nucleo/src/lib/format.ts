import { formatDate as formatDateCanonical, formatCLP, formatMoney } from "@enjambre/ui";

export { formatCLP, formatMoney };

/**
 * Default de presentación de nucleo: fecha SIN hora (dd/mm/aaaa). El canónico
 * incluye hora; los paneles de nucleo muestran solo la fecha.
 */
export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  return formatDateCanonical(iso, options ?? { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Alias histórico → formatMoney con moneda de plataforma (CLP). */
export function formatCurrency(amount: number): string {
  return formatMoney(amount);
}
