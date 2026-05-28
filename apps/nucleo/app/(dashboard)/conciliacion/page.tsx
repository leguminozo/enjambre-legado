'use client';

import { RefreshCw, Construction } from 'lucide-react';

export default function ConciliacionPage() {
  return (
    <div className="card p-8">
      <div className="flex items-center gap-3 mb-4">
        <RefreshCw size={24} className="text-muted-foreground" />
        <h1 className="text-2xl font-display text-foreground">Conciliacion</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Construction size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-lg font-display text-foreground mb-2">Modulo en migracion</h2>
        <p className="text-muted-foreground max-w-md">
          El modulo de conciliacion bancaria se encuentra en migracion desde EIRL.
          La conciliacion automatica y manual estara disponible una vez completada la migracion.
        </p>
      </div>
    </div>
  );
}
