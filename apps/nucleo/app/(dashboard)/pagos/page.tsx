'use client';

import { useState, Suspense } from 'react';
import { CreditCard, Globe } from 'lucide-react';
import { ViewLoading } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { LazySumUpView } from '@/lib/navigation/lazy-views';
import { CheckoutWebStatusPanel } from '@/views/pagos/CheckoutWebStatusPanel';

type PagosTab = 'sumup' | 'web';

export default function PagosPage() {
  const [tab, setTab] = useState<PagosTab>('sumup');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <ViewShell
          variant="compact"
          eyebrow="Finanzas · Recaudación"
          title="Pasarelas & Terminales"
          subtitle="Terminales POS SumUp para ferias y pasarelas Flow / Transbank de la tienda web."
          icon={<CreditCard size={20} />}
        />

        <div className="flex items-center gap-2">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value as PagosTab)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-10"
            aria-label="Seleccionar canal de pagos"
          >
            <option value="sumup">Canal: Terminales POS SumUp</option>
            <option value="web">Canal: Pasarela Web Flow / Transbank</option>
          </select>
        </div>
      </div>

      {tab === 'web' && <CheckoutWebStatusPanel />}

      {tab === 'sumup' && (
        <Suspense fallback={<ViewLoading variant="view" label="SumUp" hideLabel />}>
          <LazySumUpView />
        </Suspense>
      )}
    </div>
  );
}
