import type { StampProgressRow, StampProgressView } from './types';

export function computeStampRemaining(
  accumulated: number,
  required: number,
): {
  remaining: number;
  eligibleForFree: boolean;
  cyclePosition: number;
  availableFreeUnits: number;
} {
  if (required <= 0) {
    return { remaining: 0, eligibleForFree: false, cyclePosition: 0, availableFreeUnits: 0 };
  }
  const availableFreeUnits = Math.floor(accumulated / required);
  const eligibleForFree = availableFreeUnits > 0;
  const cyclePosition = accumulated % required;
  const remaining = eligibleForFree && cyclePosition === 0 ? 0 : required - cyclePosition;
  return { remaining, eligibleForFree, cyclePosition, availableFreeUnits };
}

export function toStampProgressView(row: StampProgressRow): StampProgressView | null {
  const program = row.program;
  if (!program) return null;

  const required = program.unidades_requeridas;
  const totalAccumulated = Math.max(0, row.unidades_acumuladas ?? 0);
  const totalRedeemed = Math.max(0, row.unidades_canjeadas ?? 0);
  const net = Math.max(0, totalAccumulated - totalRedeemed);
  const { remaining, eligibleForFree, cyclePosition, availableFreeUnits } = computeStampRemaining(net, required);
  const label = program.wallet_label ?? program.nombre;

  const currentAccumulated = eligibleForFree && cyclePosition === 0 ? required : cyclePosition;
  const progressPct = required > 0 ? Math.min(100, Math.round((currentAccumulated / required) * 100)) : 0;

  return {
    programId: row.program_id,
    productoId: program.producto_id,
    productoNombre: program.producto_nombre ?? null,
    imagenUrl: program.imagen_url ?? null,
    label,
    accumulated: currentAccumulated,
    required,
    remaining: eligibleForFree && cyclePosition === 0 ? 0 : remaining,
    eligibleForFree,
    progressPct,
    availableFreeUnits,
    totalAccumulated,
    totalRedeemed,
    cyclesCompleted: Math.floor(totalRedeemed / required),
  };
}

export function formatStampMessage(view: StampProgressView): string {
  if (view.eligibleForFree && (view.accumulated === view.required || ((view.availableFreeUnits ?? 0) > 0 && view.accumulated === 0))) {
    return `Recolección lista: ${view.required} sellos de ${view.label}.`;
  }
  if (view.eligibleForFree && (view.availableFreeUnits ?? 0) > 0) {
    return `1 unidad de cortesía lista para canjear. Próximo ciclo: ${view.accumulated}/${view.required} sellos.`;
  }
  if (view.remaining === 1) {
    return `Te falta 1 sello de ${view.label} para tu recolección.`;
  }
  return `Te faltan ${view.remaining} sellos de ${view.label} (${view.accumulated}/${view.required}).`;
}