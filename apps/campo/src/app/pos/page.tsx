'use client';

import { CashSessionPanel } from '@/components/pos/cash-session-panel';
import { ClientLookupPanel } from '@/components/pos/client-lookup-panel';
import { SessionVoidsPanel } from '@/components/pos/session-voids-panel';
import { useCashSession } from '@/components/pos/cash-context';
import { PackageSearch, TrendingUp, ShoppingCart, Store } from 'lucide-react';
import Link from 'next/link';
import { useClientViewLoading, ViewLoading } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useAuthStore } from '@enjambre/auth';

export default function PosIndex() {
  const { session, loading } = useCashSession();
  const user = useAuthStore((s) => s.user);
  const showLoading = useClientViewLoading(loading);

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? '¡Buenos días' : hour < 19 ? '¡Buenas tardes' : '¡Buenas noches';
  const firstName = user?.full_name?.trim().split(/\s+/)[0];
  const greeting = `${timeGreeting}${firstName ? `, ${firstName}` : ''}!`;

  if (showLoading) {
    return <ViewLoading variant="view" label="Terminal POS" hideLabel />;
  }

  return (
    <div className="space-y-6">
      <ViewShell
        variant="compact"
        eyebrow="Campo · Agente Comercial"
        greeting={greeting}
        title="Terminal POS"
        subtitle={session ? 'Sesión activa · Listo para la feria' : 'Inicia tu sesión para vender'}
        icon={<Store size={20} />}
        actions={
          <span
            className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wide font-medium ${
              session
                ? 'bg-success/15 text-success border border-success/30'
                : 'bg-warning/15 text-warning border border-warning/30'
            }`}
          >
            {session ? 'Caja abierta' : 'Caja cerrada'}
          </span>
        }
      />

      <CashSessionPanel />

      {session && (
        <div className="space-y-4">
          <ClientLookupPanel />
          <SessionVoidsPanel />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/pos/catalogo"
            prefetch
            className="card-glow min-h-11 p-5 flex items-center gap-4 hover:border-primary/40 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <PackageSearch className="w-6 h-6 text-primary" />
            </div>
            <div>
        <p className="text-sm font-bold text-foreground">Venta Rápida</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Catálogo · 3 toques</p>
            </div>
          </Link>
          <Link
            href="/pos/carrito"
            prefetch
            className="card-glow min-h-11 p-5 flex items-center gap-4 hover:border-primary/40 transition-colors group"
          >
        <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
          <ShoppingCart className="w-6 h-6 text-warning" />
            </div>
            <div>
        <p className="text-sm font-bold text-foreground">Carrito</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Multi-producto</p>
            </div>
          </Link>
          <Link
            href="/pos/historial"
            prefetch
            className="card-glow min-h-11 p-5 flex items-center gap-4 hover:border-primary/40 transition-colors group"
          >
        <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
          <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
        <p className="text-sm font-bold text-foreground">Historial</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Comisiones · Rendimiento</p>
            </div>
          </Link>
        </div>
        </div>
      )}
    </div>
  );
}
