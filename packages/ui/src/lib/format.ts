export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(iso).toLocaleDateString('es-CL', options ?? defaultOptions);
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL');
}

export function formatCLP(amount: number): string {
  return amount.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function fmtCLP(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return formatCLP(amount)
}
