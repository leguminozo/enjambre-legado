'use client';

import { Suspense } from 'react';
import { PlanesResultadoClient } from './ui';

export default function PlanesResultadoPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-sm text-muted-foreground">Confirmando pago…</p>}>
      <PlanesResultadoClient />
    </Suspense>
  );
}
