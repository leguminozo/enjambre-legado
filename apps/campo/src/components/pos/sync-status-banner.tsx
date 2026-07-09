'use client';

import { useEffect, useState } from 'react';
import { CloudOff, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/offline/db';
import { SyncQueueModal } from './sync-queue-modal';

export function SyncStatusBanner() {
  const [pendingCount, setPendingCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const pending = await db.sync_queue.where('status').equals('pending').count();
      const errors = await db.sync_queue.where('status').equals('error').toArray();
      if (!mounted) return;
      setPendingCount(pending);
      setErrorCount(errors.length);
      setLastError(errors[0]?.error_message ?? null);
    };

    void refresh();
    const interval = setInterval(() => void refresh(), 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (pendingCount === 0 && errorCount === 0 && !isModalOpen) return null;

  return (
    <>
      {(pendingCount > 0 || errorCount > 0) && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full text-left border-b border-border bg-card/40 hover:bg-card/60 transition-colors px-6 py-2 cursor-pointer focus:outline-none"
        >
          <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3 text-xs">
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground uppercase tracking-widest">
                <CloudOff className="w-3.5 h-3.5" />
                {pendingCount} venta{pendingCount === 1 ? '' : 's'} pendiente{pendingCount === 1 ? '' : 's'} de sync
              </span>
            )}
            {errorCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-destructive uppercase tracking-widest">
                <AlertTriangle className="w-3.5 h-3.5" />
                {errorCount} error{errorCount === 1 ? '' : 'es'} de sync
                {lastError ? `: ${lastError}` : ''}
              </span>
            )}
            <span className="ml-auto text-muted-foreground opacity-50 text-[10px] uppercase">
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