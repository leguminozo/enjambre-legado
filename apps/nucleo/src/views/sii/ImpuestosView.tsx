'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { Landmark, Calculator, Users, BookOpen, FileText, Receipt } from 'lucide-react';
import { ViewLoading } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import dynamic from 'next/dynamic';

const ImpuestosTab = dynamic(() => import('./components/ImpuestosTab').then((m) => ({ default: m.ImpuestosTab })), {
  loading: () => <ViewLoading variant="inline" label="Impuestos" hideLabel className="py-10" />,
});
const HonorariosTab = dynamic(() => import('./components/HonorariosTab').then((m) => ({ default: m.HonorariosTab })), {
  loading: () => <ViewLoading variant="inline" label="Honorarios" hideLabel className="py-10" />,
});

export function ImpuestosView() {
  const [subType, setSubType] = useState<'f29' | 'f22' | 'honorarios'>('f29');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <ViewShell
          variant="compact"
          eyebrow="Finanzas · Fiscal"
          title="Impuestos & F29"
          subtitle="Propuesta y cálculo de IVA crédito/débito, PPM y retención de honorarios (BHE)."
          icon={<Landmark size={20} />}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/sii"
            className="btn btn-outline text-xs inline-flex items-center gap-2 min-h-10 px-3"
          >
            <FileText size={16} />
            DTE & Facturación
          </Link>
          <Link
            href="/sii/rcv"
            className="btn btn-outline text-xs inline-flex items-center gap-2 min-h-10 px-3"
          >
            <Receipt size={16} />
            RCV
          </Link>
          <select
            value={subType}
            onChange={(e) => setSubType(e.target.value as 'f29' | 'f22' | 'honorarios')}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-10"
            aria-label="Seleccionar tipo de impuesto"
          >
            <option value="f29">Formulario F29 (Mensual)</option>
            <option value="honorarios">Boletas de Honorarios (BHE)</option>
            <option value="f22">Declaración Renta F22 (Anual)</option>
          </select>
        </div>
      </div>

      <Suspense fallback={<ViewLoading variant="inline" label="Cargando impuesto" hideLabel className="py-10" />}>
        {subType === 'f29' && <ImpuestosTab key="f29-impuestos" initialType="f29" />}
        {subType === 'f22' && <ImpuestosTab key="f22-impuestos" initialType="f22" />}
        {subType === 'honorarios' && <HonorariosTab key="honorarios-impuestos" />}
      </Suspense>
    </div>
  );
}
