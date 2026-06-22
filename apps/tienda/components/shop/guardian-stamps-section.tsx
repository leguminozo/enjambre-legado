'use client';

import { useEffect, useState } from 'react';
import type { WalletGuardianSnapshot } from '@enjambre/wallet';
import { fetchWalletSnapshot } from '@/lib/shop/wallet-api';
import { GuardianStampProgress } from './guardian-stamp-progress';
import { WalletButtons } from './wallet-buttons';

export function GuardianStampsSection({
  initialSnapshot,
}: {
  initialSnapshot?: WalletGuardianSnapshot | null;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot ?? null);
  const [loading, setLoading] = useState(!initialSnapshot);

  useEffect(() => {
    if (initialSnapshot) return;
    void (async () => {
      const data = await fetchWalletSnapshot();
      setSnapshot(data);
      setLoading(false);
    })();
  }, [initialSnapshot]);

  if (loading) {
    return <p className="text-sm text-muted-foreground italic">Cargando sellos guardian...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-foreground">Sellos del bosque</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Progreso por producto hacia tu unidad gratis — visible también en tu wallet.
          </p>
        </div>
        <WalletButtons compact />
      </div>
      <GuardianStampProgress programs={snapshot?.programs ?? []} />
    </section>
  );
}