'use client';

import { EscenaHoja } from '@/components/apicultor/cuaderno/EscenaHoja';

/** /colmenas/cuaderno/[id] — escena de una hoja (patrón RSN study detail). */
export function EscenaHojaView({ id }: { id: string }) {
  return <EscenaHoja id={id} />;
}
