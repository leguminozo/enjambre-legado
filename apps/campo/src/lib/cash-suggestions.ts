import { formatCLP } from '@enjambre/ui';

export interface CashSuggestion {
  label: string;
  val: number;
}

/**
 * Genera sugerencias inteligentes de pago en efectivo basadas en la denominación chilena (CLP).
 * Garantiza que cada sugerencia sea >= total a cobrar, eliminando errores de 'monto menor al total'.
 */
export function getCashBillSuggestions(total: number): CashSuggestion[] {
  if (total <= 0) return [{ label: 'Exacto', val: 0 }];

  const suggestions: CashSuggestion[] = [{ label: 'Exacto', val: total }];
  const CHILEAN_BILLS = [1000, 2000, 5000, 10000, 20000];

  // Billetes estándar chilenos mayores al total
  for (const bill of CHILEAN_BILLS) {
    if (bill > total && !suggestions.some((s) => s.val === bill)) {
      suggestions.push({ label: formatCLP(bill), val: bill });
    }
  }

  // Redondeos prácticos de 5.000, 10.000 o 20.000 si supera billetes estándar
  const roundSteps = [5000, 10000, 20000];
  for (const step of roundSteps) {
    const nextRound = Math.ceil(total / step) * step;
    if (nextRound > total && !suggestions.some((s) => s.val === nextRound)) {
      suggestions.push({ label: formatCLP(nextRound), val: nextRound });
    }
  }

  // Ordenar por valor ascendente y limitar a máximo 4 botones para evitar saturación visual
  return suggestions.sort((a, b) => a.val - b.val).slice(0, 4);
}
