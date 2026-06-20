export function periodoFromFecha(fecha: string): string {
  const normalized = fecha.slice(0, 10);
  const [year, month] = normalized.split('-');
  if (!year || !month) throw new Error(`Fecha inválida para período RCV: ${fecha}`);
  return `${year}${month}`;
}