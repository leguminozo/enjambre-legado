import { formatMoney, formatMoneyCompact } from './currency';

export type CalendarDateOptions =
  | { separator?: '-' | '/' }
  | Intl.DateTimeFormatOptions;

/**
 * Formatea una fecha de calendario pura (YYYY-MM-DD o medianoche UTC)
 * garantizando que NUNCA sufra desplazamiento de día por husos horarios (ej. Chile UTC-3 / UTC-4).
 * Retorna en formato chileno: DD-MM-YYYY (o con el separador o Intl options indicadas).
 */
export function formatCalendarDate(
  dateInput: string | null | undefined,
  options?: CalendarDateOptions,
): string {
  if (!dateInput) return '—';
  const clean = dateInput.trim();
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return formatDate(clean, options && !('separator' in options) ? (options as Intl.DateTimeFormatOptions) : undefined);
  }
  const [, y, m, d] = match;

  if (options && ('day' in options || 'month' in options || 'year' in options || 'dateStyle' in options)) {
    const localDate = new Date(Number(y), Number(m) - 1, Number(d));
    return localDate.toLocaleDateString('es-CL', options as Intl.DateTimeFormatOptions);
  }

  const sep = (options && 'separator' in options && options.separator) ? options.separator : '-';
  return `${d}${sep}${m}${sep}${y}`;
}

/**
 * Convierte un string de fecha (ej. "2026-10-04") a ISO seguro a mediodía UTC (12:00:00Z).
 * Esto previene que al persistir en columnas TIMESTAMPTZ sufra desfase de día en husos horarios americanos.
 */
export function toCalendarIso(fechaStr: string | null | undefined): string {
  if (!fechaStr) return new Date().toISOString();
  const clean = fechaStr.trim();
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m}-${d}T12:00:00.000Z`;
  }
  return clean;
}

export function formatDate(
  iso: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!iso) return '—';
  try {
    const clean = iso.trim();
    // Si es una fecha de calendario pura o medianoche UTC y no se piden horas/minutos explícitos,
    // preservamos el día local exacto para evitar el salto de día UTC-3/UTC-4.
    const isCalendarDate = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]00:00(?::00(?:\.000)?)?(?:Z|[+-]00:00)?)?$/.test(clean);
    const hasTimeRequested = options && (options.hour !== undefined || options.minute !== undefined || options.timeStyle !== undefined);

    if (isCalendarDate && !hasTimeRequested) {
      const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, y, m, day] = match;
        const localDate = new Date(Number(y), Number(m) - 1, Number(day));
        const defaultDateOptions: Intl.DateTimeFormatOptions = {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        };
        return localDate.toLocaleDateString('es-CL', options ?? defaultDateOptions);
      }
    }

    const d = new Date(clean);
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

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const clean = iso.trim();
    // Si coincide con fecha de calendario (YYYY-MM-DD o medianoche UTC), formatear sin saltos de huso horario
    const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ]00:00(?::00(?:\.000)?)?(?:Z|[+-]00:00)?)?$/);
    if (match) {
      const [, y, m, d] = match;
      return `${d}-${m}-${y}`;
    }
    const d = new Date(clean);
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
