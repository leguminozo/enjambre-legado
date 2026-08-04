import { formatCLP } from "@enjambre/ui";

export { formatCLP };

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  return new Date(iso).toLocaleDateString('es-CL', options ?? defaultOptions);
}

// Formateo canónico único: @enjambre/ui (formatCLP). Este alias histórico
// evita duplicar Intl es-CL/CLP en cada vista.
export function formatCurrency(amount: number): string {
  return formatCLP(amount);
}
