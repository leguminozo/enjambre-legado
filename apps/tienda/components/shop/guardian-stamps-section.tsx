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
          <h2 className="font-display text-xl text-foreground">Tus rutas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sellos por producto hacia una cosecha. En el computador, el QR lleva la tarjeta al
            teléfono.
          </p>
        </div>
        <WalletButtons compact />
      </div>
      <GuardianStampProgress programs={snapshot?.programs ?? []} />
    </section>
  );
}