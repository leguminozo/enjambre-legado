'use client';

/**
 * Banner global de pendientes de sync de la bitácora (patio).
 * Patrón SyncStatusBanner de Campo, dominio NucleoBitacoraDB.
 * Visible para admin/apicultor cuando hay cola local.
 */

import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CloudOff, AlertTriangle, RefreshCw, Wifi } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { resolveShellRoleKey } from '@/config/sidebar-config';
import { db } from '@/lib/offline/db';
import { useBitacoraSync } from '@/providers/bitacora-sync-provider';

export function BitacoraSyncBanner() {
  const rawRole = useAuthStore((s) => s.user?.role);
  const role = resolveShellRoleKey(rawRole);
  const { triggerSync } = useBitacoraSync();
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  const counts = useLiveQuery(async () => {
    const pending = await db.sync_queue.where('status').equals('pending').count();
    const errors = await db.sync_queue.where('status').equals('error').toArray();
    return {
      pending,
      errors: errors.length,
      lastError: errors[0]?.error_message ?? null,
    };
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const handleSync = useCallback(async () => {
    if (!online || syncing) return;
    setSyncing(true);
    try {
      await triggerSync();
    } finally {
      setSyncing(false);
    }
  }, [online, syncing, triggerSync]);

  // Solo patio y admin (quien usa bitácora en Núcleo)
  if (role !== 'apicultor' && role !== 'admin') return null;

  const pending = counts?.pending ?? 0;
  const errors = counts?.errors ?? 0;
  if (pending === 0 && errors === 0) return null;

  return (
    <div
      className="w-full border-b border-border bg-card/50 px-4 py-2 sm:px-6"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 text-xs">
        {!online && (
          <span className="inline-flex items-center gap-1.5 font-medium uppercase tracking-wide text-warning">
            <CloudOff className="size-3.5" />
            Sin señal
          </span>
        )}
        {pending > 0 && (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <CloudOff className="size-3.5" />
            {pending} {pending === 1 ? 'registro' : 'registros'} de visitas pendiente
            {pending === 1 ? '' : 's'} de sincronización
          </span>
        )}
        {errors > 0 && (
          <span className="inline-flex items-center gap-1.5 text-destructive">
            <AlertTriangle className="size-3.5" />
            {errors} {errors === 1 ? 'pendiente con reintento' : 'pendientes con reintento'}
            {counts?.lastError ? `: ${counts.lastError}` : ''}
          </span>
        )}
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={!online || syncing}
          className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          {syncing ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : online ? (
            <Wifi className="size-3.5" />
          ) : (
            <CloudOff className="size-3.5" />
          )}
          {syncing ? 'Sincronizando…' : online ? 'Sincronizar ahora' : 'Esperando red'}
        </button>
      </div>
    </div>
  );
}
