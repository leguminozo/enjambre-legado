export type FeriaContratoEstado = 'activo' | 'borrador' | 'suspendido' | 'terminado' | 'sin_contrato';

export interface FeriaContratoRef {
  user_id: string;
  estado: string;
  id?: string;
}

const PRIORITY: FeriaContratoEstado[] = ['activo', 'borrador', 'suspendido', 'terminado'];

/** Estado más relevante del operador (activo > borrador > suspendido > terminado > sin_contrato). */
export function feriaContratoEstadoForUser(
  contratos: FeriaContratoRef[],
  userId: string,
): FeriaContratoEstado {
  const mine = contratos.filter((c) => c.user_id === userId);
  if (mine.length === 0) return 'sin_contrato';
  for (const estado of PRIORITY) {
    if (mine.some((c) => c.estado === estado)) return estado;
  }
  return 'sin_contrato';
}

export function repNecesitaContratoFeriaActivo(
  contratos: FeriaContratoRef[],
  userId: string,
): boolean {
  return feriaContratoEstadoForUser(contratos, userId) !== 'activo';
}

export const FERIA_CONTRATO_ESTADO_LABEL: Record<FeriaContratoEstado, string> = {
  activo: 'Contrato activo',
  borrador: 'Borrador pendiente',
  suspendido: 'Suspendido',
  terminado: 'Terminado',
  sin_contrato: 'Sin contrato feria',
};