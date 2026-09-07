import { formatMoney, formatMoneyCompact } from './currency';

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return d.toLocaleString('es-CL', options ?? defaultOptions);
  } catch {
    return '—';
  }
}

export function formatDateShort(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-CL');
  } catch {
    return '—';
  }
}

/**
 * Formato monetario canónico de plataforma (default CLP: `$8.000`).
 * Preferir formatMoney cuando se quiera pasar currency explícita.
 */
export function formatCLP(amount: number): string {
  return formatMoney(amount, 'CLP');
}

export function fmtCLP(amount: number): string {
  return formatMoneyCompact(amount, 'CLP');
}
