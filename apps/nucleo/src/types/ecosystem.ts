import type { ColmenaRow } from '@/lib/apicultor-types';

export function healthFromEstado(estado: string | null | undefined): ColmenaRow['health'] {
  if (estado === 'optima' || estado === 'optimal') return 'optimal';
  if (estado === 'atencion' || estado === 'attention') return 'attention';
  return 'risk';
}

export function estadoFromHealth(health: ColmenaRow['health']): string {
  if (health === 'optimal') return 'optima';
  if (health === 'attention') return 'atencion';
  return 'riesgo';
}

export function guardianLevel(totalSpent: number): string {
  if (totalSpent >= 200_000) return 'Guardián Platino';
  if (totalSpent >= 100_000) return 'Guardián Oro';
  if (totalSpent >= 50_000) return 'Guardián Plata';
  return 'Guardián Bronce';
}