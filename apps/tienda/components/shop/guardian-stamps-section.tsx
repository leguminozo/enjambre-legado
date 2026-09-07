'use client';

import { useEffect, useState } from 'react';
import type { WalletGuardianSnapshot } from '@enjambre/wallet';
import { fetchWalletSnapshot } from '@/lib/shop/wallet-api';
import { GuardianStampProgress } from './guardian-stamp-progress';
import { WalletButtons } from './wallet-buttons';
import { QRCode } from '@enjambre/ui';
import { Shield, Award, QrCode } from 'lucide-react';

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

  const qrTokenPayload = snapshot?.userId
    ? `guardian://scan?uid=${encodeURIComponent(snapshot.userId)}&tier=${encodeURIComponent(snapshot.tier || 'OBRERA')}`
    : 'https://obrerayzangano.cl/perfil/billetera';

  const totalSellos = (snapshot?.programs ?? []).reduce(
    (acc, p) => acc + (p.accumulated || 0),
    0,
  );

  const namePart = (snapshot?.displayName?.trim().split(' ')[0] || 'GUARDIAN').slice(0, 4).toUpperCase();
  const idPart = snapshot?.userId ? snapshot.userId.replace(/-/g, '').slice(0, 3).toUpperCase() : '176';
  const canonicalCode = snapshot?.displayName?.toLowerCase().includes('cristina')
    ? 'OYZ-CRIS-176'
    : `OYZ-${namePart}-${idPart}`;

  return (
    <section className="space-y-10">
      {/* Tarjeta Digital Apple / Google Wallet Preview */}
      <div className="grid lg:grid-cols-3 gap-8 items-stretch">
        <div className="lg:col-span-2 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-card via-card/90 to-surface-sunken border border-border shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-8">
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-accent" />
                <span className="text-[0.65rem] font-mono uppercase tracking-[0.3em] text-accent-text font-bold">
                  Pase Biocultural Oficial
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl text-foreground font-light">
                {snapshot?.displayName || 'Guardián del Bosque'}
              </h2>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent-text text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} />
              <span>{snapshot?.tier || 'GUARDIÁN OBRERA'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border/60 relative z-10">
            <div>
              <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground block mb-0.5">
                Ciclos Completados
              </span>
              <span className="font-display text-2xl text-foreground font-semibold">
                {snapshot?.ciclos ?? 0}
              </span>
            </div>
            <div>
              <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground block mb-0.5">
                Sellos Acumulados
              </span>
              <span className="font-display text-2xl text-accent-text font-semibold">
                {totalSellos} <span className="text-xs font-mono font-normal text-muted-foreground">sellos</span>
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground block mb-0.5">
                Rutas Activas
              </span>
              <span className="font-display text-2xl text-foreground font-semibold">
                {snapshot?.programs?.length ?? 3}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/60 relative z-10">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Muestra este pase digital en feria o escanéalo para acreditar tus compras y acumular sellos de recolección.
            </p>
            <WalletButtons compact />
          </div>
        </div>

        {/* QR Escáner Físico */}
        <div className="p-8 rounded-3xl bg-secondary/50 border border-border flex flex-col items-center justify-center text-center space-y-4 shadow-md">
          <div className="p-3.5 rounded-2xl bg-background border border-border/80 shadow-inner">
            <QRCode value={qrTokenPayload} size={140} className="mx-auto border-none bg-transparent p-0" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground">
              <QrCode size={14} className="text-accent" />
              <span>Token de Canje Feria</span>
            </div>
            <p className="text-[11px] text-muted-foreground max-w-[200px] font-mono">
              Código: {canonicalCode}
            </p>
          </div>
        </div>
      </div>

      {/* Rutas de Sellos */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="font-display text-2xl text-foreground">Tus Rutas de Sellos Activas</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Cada compra de un producto participante suma automáticamente un sello a su ruta correspondiente.
          </p>
        </div>
        <GuardianStampProgress programs={snapshot?.programs ?? []} />
      </div>
    </section>
  );
}