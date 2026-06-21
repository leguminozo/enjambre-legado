'use client';

import { Package, Store, AlertTriangle } from 'lucide-react';
import { useFeriaContext } from './feria-context';

export function FeriaContextBanner() {
  const { loading, active, evento, consignaciones } = useFeriaContext();

  if (loading) {
    return (
      <div className="border-b border-border bg-card/30 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3 text-xs text-muted-foreground uppercase tracking-widest">
          <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
          Cargando contexto feria...
        </div>
      </div>
    );
  }

  if (!active || !evento) {
    return (
      <div className="border-b border-border bg-background/60 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Store className="w-3.5 h-3.5" />
          Sin evento feria en curso — ventas feria usan stock de almacén
        </div>
      </div>
    );
  }

  const totalPendiente = consignaciones.reduce((s, c) => s + c.pendiente, 0);
  const ubicacion = evento.ubicacion ? ` · ${evento.ubicacion}` : '';

  return (
    <div className="border-b border-primary/20 bg-primary/5 px-6 py-3">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Store className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Evento en curso</p>
            <p className="text-sm text-foreground font-medium">
              {evento.nombre_evento}
              <span className="text-muted-foreground font-normal">{ubicacion}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Package className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground uppercase tracking-widest">Consignado pendiente:</span>
          <span className="font-mono font-bold text-foreground">{totalPendiente} uds</span>
        </div>
      </div>

      {consignaciones.length === 0 && (
        <div className="max-w-5xl mx-auto mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          No hay productos consignados para este evento. Las ventas feria serán bloqueadas.
        </div>
      )}
    </div>
  );
}