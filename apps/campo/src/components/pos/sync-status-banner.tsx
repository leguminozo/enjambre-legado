'use client';

import { useState } from 'react';
import { CloudOff, AlertTriangle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/offline/db';
import { SyncQueueModal } from './sync-queue-modal';

export function SyncStatusBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // liveQuery re-emite ante cualquier escritura en sync_queue — sin polling de 5s
  const pendingCount = useLiveQuery(
    () => db.sync_queue.where('status').equals('pending').count(),
    [],
    0,
  );
  const errorRows = useLiveQuery(
    () => db.sync_queue.where('status').equals('error').toArray(),
    [],
    [] as Array<{ error_message?: string }>,
  );
  const errorCount = errorRows.length;
  const lastError = errorRows[0]?.error_message ?? null;

  if (pendingCount === 0 && errorCount === 0 && !isModalOpen) return null;

  return (
    <>
      {(pendingCount > 0 || errorCount > 0) && (
        <button 
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full min-h-11 text-left border-b border-border bg-card/40 hover:bg-card/60 transition-colors px-6 py-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3 text-xs">
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground tracking-wide font-medium">
                <CloudOff className="w-3.5 h-3.5 text-accent" />
                {pendingCount} {pendingCount === 1 ? 'venta guardada' : 'ventas guardadas'} en el teléfono (modo sin conexión)
              </span>
            )}
            {errorCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-destructive tracking-wide font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {errorCount} {errorCount === 1 ? 'venta requiere reintento' : 'ventas requieren reintento'}
                {lastError ? `: ${lastError}` : ''}
              </span>
            )}
            <span className="ml-auto text-muted-foreground hover:text-foreground text-xs font-medium">
              Ver detalles &rarr;
            </span>
          </div>
        </button>
      )}
      
      {isModalOpen && (
        <SyncQueueModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}