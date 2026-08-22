'use client';

import React, { Suspense } from 'react';
import { Receipt } from 'lucide-react';
import { ViewLoading } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import dynamic from 'next/dynamic';

const RcvTab = dynamic(() => import('./components/RcvTab').then((m) => ({ default: m.RcvTab })), {
  loading: () => <ViewLoading variant="inline" label="RCV" hideLabel className="py-10" />,
});

export function RcvView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        variant="compact"
        eyebrow="Finanzas · Fiscal"
        title="Registro de Compras y Ventas (RCV)"
        subtitle="Sincronización mensual directa con el SII: documentos recibidos, emitidos y estado de aceptación."
        icon={<Receipt size={20} />}
      />

      <Suspense fallback={<ViewLoading variant="inline" label="RCV" hideLabel className="py-10" />}>
        <RcvTab />
      </Suspense>
    </div>
  );
}
