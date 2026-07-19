'use client';

import { useState, Suspense } from 'react';
import { CreditCard, Globe } from 'lucide-react';
import { ViewLoading } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { ToolActionRail } from '@/components/layout/ToolActionRail';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { LazySumUpView } from '@/lib/navigation/lazy-views';
import { CheckoutWebStatusPanel } from '@/views/pagos/CheckoutWebStatusPanel';

type PagosTab = 'sumup' | 'web';

export default function PagosPage() {
  const [tab, setTab] = useState<PagosTab>('sumup');

  return (
    <div className="space-y-6">
      {tab === 'web' && (
        <>
          <ViewShell
            variant="compact"
            eyebrow="Pagos"
            title="Checkout web · Flow / Transbank"
            subtitle="Estado go-live del cobro D2C y sesiones de checkout"
            icon={<Globe size={20} />}
          />
          <ToolActionRail context="sumup" current="/pagos" />
          <ResponsiveTabBar
            variant="pill"
            layoutId="pagos-hub-tabs"
            tabs={[
              { id: 'sumup', label: 'Terminal SumUp', icon: <CreditCard size={16} /> },
              { id: 'web', label: 'Checkout web', icon: <Globe size={16} /> },
            ]}
            activeId={tab}
            onChange={(id) => setTab(id as PagosTab)}
          />
          <CheckoutWebStatusPanel />
        </>
      )}

      {tab === 'sumup' && (
        <div className="space-y-4">
          <ResponsiveTabBar
            variant="pill"
            layoutId="pagos-hub-tabs"
            tabs={[
              { id: 'sumup', label: 'Terminal SumUp', icon: <CreditCard size={16} /> },
              { id: 'web', label: 'Checkout web', icon: <Globe size={16} /> },
            ]}
            activeId={tab}
            onChange={(id) => setTab(id as PagosTab)}
          />
          <Suspense fallback={<ViewLoading variant="view" label="SumUp" hideLabel />}>
            <LazySumUpView />
          </Suspense>
        </div>
      )}
    </div>
  );
}
