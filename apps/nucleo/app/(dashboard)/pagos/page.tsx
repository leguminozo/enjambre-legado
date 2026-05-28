'use client';

import { CreditCard, Construction } from 'lucide-react';

export default function PagosPage() {
  return (
    <div className="card p-8">
      <div className="flex items-center gap-3 mb-4">
        <CreditCard size={24} className="text-muted-foreground" />
        <h1 className="text-2xl font-display text-foreground">Pagos SumUp</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Construction size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-lg font-display text-foreground mb-2">Modulo en migracion</h2>
        <p className="text-muted-foreground max-w-md">
          El modulo de pagos SumUp se encuentra en migracion desde EIRL.
          Las transacciones, payouts y conciliacion estaran disponibles una vez completada la migracion.
        </p>
      </div>
    </div>
  );
}
