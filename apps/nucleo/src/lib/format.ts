import { formatCLP, formatMoney } from "@enjambre/ui";

export { formatCLP, formatMoney };

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  return new Date(iso).toLocaleDateString('es-CL', options ?? defaultOptions);
}

/** Alias histórico → formatMoney con moneda de plataforma (CLP). */
export function formatCurrency(amount: number): string {
  return formatMoney(amount);
}
