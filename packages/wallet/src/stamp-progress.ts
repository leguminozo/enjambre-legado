import type { StampProgressRow, StampProgressView } from './types';

export function computeStampRemaining(
  accumulated: number,
  required: number,
): { remaining: number; eligibleForFree: boolean; cyclePosition: number } {
  if (required <= 0) {
    return { remaining: 0, eligibleForFree: false, cyclePosition: 0 };
  }
  const cyclePosition = accumulated % required;
  const remaining = cyclePosition === 0 && accumulated > 0 ? 0 : required - cyclePosition;
  const eligibleForFree = accumulated > 0 && cyclePosition === 0;
  return { remaining, eligibleForFree, cyclePosition };
}

export function toStampProgressView(row: StampProgressRow): StampProgressView | null {
  const program = row.program;
  if (!program) return null;

  const required = program.unidades_requeridas;
  const net = Math.max(0, row.unidades_acumuladas - row.unidades_canjeadas);
  const { remaining, eligibleForFree, cyclePosition } = computeStampRemaining(net, required);
  const label = program.wallet_label ?? program.nombre;

  return {
    programId: row.program_id,
    label,
    accumulated: cyclePosition === 0 && net > 0 ? required : cyclePosition,
    required,
    remaining: eligibleForFree ? 0 : remaining,
    eligibleForFree,
    progressPct: required > 0 ? Math.round((cyclePosition / required) * 100) : 0,
  };
}

export function formatStampMessage(view: StampProgressView): string {
  if (view.eligibleForFree) {
    return `¡Listo! Tienes ${view.required} unidades — reclama tu gratis del bosque.`;
  }
  if (view.remaining === 1) {
    return `Te falta 1 unidad de ${view.label} para tu regalo.`;
  }
  return `Te faltan ${view.remaining} de ${view.label} (${view.accumulated}/${view.required}).`;
}