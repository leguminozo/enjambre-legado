'use client';

import React, { useState, Suspense } from 'react';
import { Landmark, FileText, Receipt } from 'lucide-react';
import { ViewLoading } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import dynamic from 'next/dynamic';

import { FiscalSiiSkeleton } from '@/components/shared/skeletons';

const ImpuestosTab = dynamic(() => import('./components/ImpuestosTab').then((m) => ({ default: m.ImpuestosTab })), {
  loading: () => <FiscalSiiSkeleton />,
});
const HonorariosTab = dynamic(() => import('./components/HonorariosTab').then((m) => ({ default: m.HonorariosTab })), {
  loading: () => <FiscalSiiSkeleton />,
});

export function ImpuestosView() {
  const [subType, setSubType] = useState<'f29' | 'f22' | 'honorarios'>('f29');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        variant="compact"
        eyebrow="SII · Fiscal"
        title="Impuestos & F29"
        subtitle="Propuesta y cálculo de IVA crédito/débito, PPM y retención de honorarios (BHE)."
        icon={<Landmark size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="impuestos-tabs"
        tabs={[
          { id: 'f29', label: 'Formulario F29 (Mensual)', icon: <FileText size={16} /> },
          { id: 'honorarios', label: 'Boletas de Honorarios (BHE)', icon: <Receipt size={16} /> },
          { id: 'f22', label: 'Declaración Renta F22 (Anual)', icon: <Landmark size={16} /> },
        ]}
        activeId={subType}
        onChange={(id) => setSubType(id as 'f29' | 'f22' | 'honorarios')}
      />

      <Suspense fallback={<FiscalSiiSkeleton />}>
        {subType === 'f29' && <ImpuestosTab key="f29-impuestos" initialType="f29" />}
        {subType === 'f22' && <ImpuestosTab key="f22-impuestos" initialType="f22" />}
        {subType === 'honorarios' && <HonorariosTab key="honorarios-impuestos" />}
      </Suspense>
    </div>
  );
}
