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
