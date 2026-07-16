'use client';

import { useState, useEffect } from 'react';
import { db, type SyncQueueItem } from '@/lib/offline/db';
import { X, RefreshCw, Trash2, CloudOff, AlertTriangle } from 'lucide-react';
import { useSyncEngine } from '@/hooks/use-sync-engine';

interface SyncQueueModalProps {
  onClose: () => void;
}

export function SyncQueueModal({ onClose }: SyncQueueModalProps) {
  const [items, setItems] = useState<SyncQueueItem[]>([]);
  const { triggerSync } = useSyncEngine();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const all = await db.sync_queue.orderBy('created_at').reverse().toArray();
    setItems(all);
  };

  const handleRetryAll = async () => {
    setIsSyncing(true);
    // Cambiar estado a 'pending' a todos los de 'error' para forzar reintento
    const errorItems = items.filter(i => i.status === 'error');
    for (const item of errorItems) {
      if (item.id) {
        await db.sync_queue.update(item.id, { status: 'pending', error_message: undefined });
      }
    }
    await loadItems();
    await triggerSync();
    await loadItems();
    setIsSyncing(false);
  };

  const handleDiscard = async (id: number) => {
    if (confirm('¿Está seguro de descartar este registro permanentemente? Esto no revertirá el stock local descontado.')) {
      await db.sync_queue.delete(id);
      await loadItems();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-sunken">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Cola de Sincronización</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Gestión Offline-First</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-background space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              <CloudOff className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">No hay registros pendientes en la cola.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className={`p-4 rounded-xl border ${item.status === 'error' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {item.status === 'error' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={12} /> Error
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-info bg-info/10 px-2 py-0.5 rounded-full">
                          Pendiente
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {new Date(item.created_at).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      ID Local: {item.id} · Venta {item.payload.channel === 'feria' ? 'Feria' : 'Directa'}
                    </div>
                    {item.status === 'error' && item.error_message && (
                      <div className="mt-2 text-xs text-destructive/90 bg-destructive/10 p-2 rounded-md">
                        {item.error_message}
                      </div>
                    )}
                  </div>
                  {item.status === 'error' && (
                    <button
                      onClick={() => item.id && handleDiscard(item.id)}
                      className="shrink-0 btn btn-ghost text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-3 text-xs"
                    >
                      <Trash2 size={14} className="mr-1.5" />
                      Descartar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-surface-sunken flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Total en cola: {items.length}
          </div>
          <div className="flex gap-3">
            <button className="btn btn-ghost" onClick={onClose}>
              Cerrar
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleRetryAll}
              disabled={isSyncing || items.length === 0}
            >
              <RefreshCw size={14} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Reintentar Todo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
