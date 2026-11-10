'use client';

import { useState, Suspense } from 'react';
import { CreditCard, Globe } from 'lucide-react';
import { ViewLoading } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { LazySumUpView } from '@/lib/navigation/lazy-views';
import { CheckoutWebStatusPanel } from '@/views/pagos/CheckoutWebStatusPanel';

type PagosTab = 'sumup' | 'web';

export default function PagosPage() {
  const [tab, setTab] = useState<PagosTab>('sumup');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        variant="compact"
        eyebrow="Finanzas · Recaudación"
        title="Pasarelas & Terminales"
        subtitle="Terminales POS SumUp para ferias y pasarelas Flow / Transbank de la tienda web."
        icon={<CreditCard size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="pagos-channel-tabs"
        tabs={[
          {
            id: 'sumup',
            label: 'Terminales POS SumUp',
            icon: <CreditCard size={16} />,
          },
          {
            id: 'web',
            label: 'Pasarela Web Flow / Transbank',
            icon: <Globe size={16} />,
          },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as PagosTab)}
      />

      {tab === 'web' && <CheckoutWebStatusPanel />}

      {tab === 'sumup' && (
        <Suspense fallback={<ViewLoading variant="view" label="SumUp" hideLabel />}>
          <LazySumUpView />
        </Suspense>
      )}
    </div>
  );
}
