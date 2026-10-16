import {
  formatDate as formatDateCanonical,
  formatDateShort,
  formatCalendarDate,
  toCalendarIso,
  type CalendarDateOptions,
  formatCLP,
  formatMoney,
  fmtCLP,
} from "@enjambre/ui";

export {
  formatCLP,
  fmtCLP,
  formatMoney,
  formatDateShort,
  formatCalendarDate,
  toCalendarIso,
  type CalendarDateOptions,
};

/**
 * Default de presentación de nucleo: fecha SIN hora (dd/mm/aaaa).
 * Protegido contra desplazamiento de huso horario en fechas de calendario y medianoche UTC.
 */
export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  return formatDateCanonical(iso, options ?? { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Alias histórico → formatMoney con moneda de plataforma (CLP). */
export function formatCurrency(amount: number): string {
  return formatMoney(amount);
}
