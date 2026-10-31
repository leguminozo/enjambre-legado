'use client';

import { EscenaHoja } from '@/components/apicultor/cuaderno/EscenaHoja';

/** /colmenas/cuaderno/[id] — escena detallada de una hoja de cuaderno apícola. */
export function EscenaHojaView({ id }: { id: string }) {
  return <EscenaHoja id={id} />;
}
