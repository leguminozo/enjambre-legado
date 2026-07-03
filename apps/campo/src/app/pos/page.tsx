'use client';

import { CashSessionPanel } from '@/components/pos/cash-session-panel';
import { ClientLookupPanel } from '@/components/pos/client-lookup-panel';
import { useCashSession } from '@/components/pos/cash-context';
import { PackageSearch, TrendingUp, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { ViewLoading } from '@enjambre/ui';

export default function PosIndex() {
  const { session, loading } = useCashSession();

  if (loading) {
    return <ViewLoading variant="view" label="Terminal POS" hideLabel />;
  }

  return (
    <div className="space-y-6">
      <div>
      <h1 className="font-serif text-2xl text-foreground mb-1">Terminal POS</h1>
      <p className="text-xs text-muted-foreground uppercase tracking-widest">
          {session ? 'Sesión activa · Listo para vender' : 'Inicia tu sesión para vender'}
        </p>
      </div>

      <CashSessionPanel />

      {session && (
        <div className="space-y-4">
          <ClientLookupPanel />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/pos/catalogo"
            className="card-glow p-5 flex items-center gap-4 hover:border-primary/40 transition-colors group"
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
            className="card-glow p-5 flex items-center gap-4 hover:border-primary/40 transition-colors group"
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
            className="card-glow p-5 flex items-center gap-4 hover:border-primary/40 transition-colors group"
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
