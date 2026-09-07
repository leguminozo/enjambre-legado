'use client';

import { useState, useEffect } from 'react';
import { db, type SyncQueueItem } from '@/lib/offline/db';
import { RefreshCw, Trash2, CloudOff, AlertTriangle } from 'lucide-react';
import { useSyncEngine } from '@/hooks/use-sync-engine';
import { ImmersiveModal } from '@enjambre/ui';

interface SyncQueueModalProps {
  onClose: () => void;
}

export function SyncQueueModal({ onClose }: SyncQueueModalProps) {
  const [items, setItems] = useState<SyncQueueItem[]>([]);
  const { triggerSync } = useSyncEngine();
  const [isSyncing, setIsSyncing] = useState(false);

  const loadItems = async () => {
    const all = await db.sync_queue.orderBy('created_at').reverse().toArray();
    setItems(all);
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const handleRetryAll = async () => {
    setIsSyncing(true);
    const errorItems = items.filter((i) => i.status === 'error');
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
    if (
      confirm(
        '¿Está seguro de descartar este registro permanentemente? Esto no revertirá el stock local descontado.',
      )
    ) {
      await db.sync_queue.delete(id);
      await loadItems();
    }
  };

  return (
    <ImmersiveModal
      open
      onClose={onClose}
      size="lg"
      eyebrow="Offline-first"
      title="Cola de Sincronización"
      footer={
        <>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            onClick={() => void handleRetryAll()}
            disabled={isSyncing || items.length === 0}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Sincronizando...' : 'Reintentar Todo'}
          </button>
        </>
      }
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider -mt-2 mb-4">
        Gestión de ventas pendientes · Total en cola: {items.length}
      </p>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
          <CloudOff className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-sm">No hay registros pendientes en la cola.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border ${
                item.status === 'error'
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-border bg-card'
              } flex flex-col md:flex-row md:items-center justify-between gap-4`}
            >
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
                  ID Local: {item.id} · Venta{' '}
                  {item.payload.channel === 'feria' ? 'Feria' : 'Directa'}
                </div>
                {item.status === 'error' && item.error_message && (
                  <div className="mt-2 text-xs text-destructive/90 bg-destructive/10 p-2 rounded-md">
                    {item.error_message}
                  </div>
                )}
              </div>
              {item.status === 'error' && (
                <button
                  type="button"
                  onClick={() => item.id && void handleDiscard(item.id)}
                  className="shrink-0 inline-flex min-h-11 items-center px-3 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 size={14} className="mr-1.5" />
                  Descartar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </ImmersiveModal>
  );
}
