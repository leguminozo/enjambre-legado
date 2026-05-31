'use client';

import { CashSessionPanel } from '@/components/pos/cash-session-panel';
import { ClientLookupPanel } from '@/components/pos/client-lookup-panel';
import { useCashSession } from '@/components/pos/cash-context';
import { PackageSearch, TrendingUp, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function PosIndex() {
  const { session, loading } = useCashSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-stone-500 uppercase tracking-widest">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-white mb-1">Terminal POS</h1>
        <p className="text-xs text-stone-500 uppercase tracking-widest">
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
              <p className="text-sm font-bold text-white">Venta Rápida</p>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest">Catálogo · 3 toques</p>
            </div>
          </Link>
          <Link
            href="/pos/carrito"
            className="card-glow p-5 flex items-center gap-4 hover:border-primary/40 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <ShoppingCart className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Carrito</p>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest">Multi-producto</p>
            </div>
          </Link>
          <Link
            href="/pos/historial"
            className="card-glow p-5 flex items-center gap-4 hover:border-primary/40 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Historial</p>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest">Comisiones · Rendimiento</p>
            </div>
          </Link>
        </div>
        </div>
      )}
    </div>
  );
}
