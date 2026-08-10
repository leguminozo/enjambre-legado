'use client';

import { Printer } from 'lucide-react';

/**
 * Imprime la propuesta B2G como PDF (papel de reunión municipal).
 * Header/footer de la página se ocultan con variantes print: de Tailwind.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center gap-2 px-5 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-xl text-sm font-medium transition-colors"
    >
      <Printer className="w-4 h-4" />
      Imprimir / PDF
    </button>
  );
}
