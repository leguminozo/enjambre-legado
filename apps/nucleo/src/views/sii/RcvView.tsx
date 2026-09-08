'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { Receipt, FileText, Landmark } from 'lucide-react';
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
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/sii"
              className="btn btn-outline text-xs inline-flex items-center gap-2 min-h-10 px-3"
            >
              <FileText size={16} />
              DTE & Facturación
            </Link>
            <Link
              href="/sii/impuestos"
              className="btn btn-outline text-xs inline-flex items-center gap-2 min-h-10 px-3"
            >
              <Landmark size={16} />
              Impuestos F29
            </Link>
          </div>
        }
      />

      <Suspense fallback={<ViewLoading variant="inline" label="RCV" hideLabel className="py-10" />}>
        <RcvTab />
      </Suspense>
    </div>
  );
}
