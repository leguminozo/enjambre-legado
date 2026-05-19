export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  return new Date(iso).toLocaleDateString('es-CL', options ?? defaultOptions);
}
