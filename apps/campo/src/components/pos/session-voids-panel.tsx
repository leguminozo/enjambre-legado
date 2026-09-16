'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@enjambre/auth';
import { useCashSession } from './cash-context';
import { formatCLP, friendlyError, ConfirmDialog } from '@enjambre/ui';
import { getNucleoApiUrl } from '@/lib/public-urls';
import { RotateCcw, AlertTriangle, CloudOff, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/offline/db';

type SessionVenta = {
  id: string;
  total: number;
  metodo_pago: string | null;
  channel: string | null;
  estado: string | null;
  created_at: string | null;
  lines: Array<{ producto_id: string; nombre?: string; cantidad: number }>;
};

/**
 * Anulación de ventas de la sesión abierta (devolución operativa feria).
 */
export function SessionVoidsPanel() {
  const { session, refreshStatus } = useCashSession();
  const token = useAuthStore((s) => s.session)?.access_token;
  const API_BASE = getNucleoApiUrl();
  const [ventas, setVentas] = useState<SessionVenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anularTargetId, setAnularTargetId] = useState<string | null>(null);
  const [descartarTargetId, setDescartarTargetId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token || !session?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/rep-ventas/session-ventas?cash_session_id=${session.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error('No se pudieron cargar ventas de la sesión');
      const json = (await res.json()) as { data?: SessionVenta[] };
      setVentas(json.data ?? []);
    } catch (err) {
      setError(friendlyError(err, 'Error al cargar'));
    } finally {
      setLoading(false);
    }
  }, [token, session, API_BASE]);

  useEffect(() => {
    void load();
  }, [load]);

  const executeAnular = async () => {
    if (!token || !anularTargetId) return;
    const id = anularTargetId;
    setVoidingId(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/rep-ventas/ventas/${id}/anular`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { message?: string }).message || 'No se pudo anular');
      }
      await load();
      await refreshStatus();
      setAnularTargetId(null);
    } catch (err) {
      setError(friendlyError(err, 'Error al anular'));
    } finally {
      setVoidingId(null);
    }
  };

  const pendingQueue = useLiveQuery(() => db.sync_queue.toArray()) ?? [];

  const executeDescartar = async () => {
    if (descartarTargetId == null) return;
    try {
      await db.sync_queue.delete(descartarTargetId);
      setDescartarTargetId(null);
    } catch (err) {
      console.error('Error al descartar venta de cola:', err);
    }
  };

  if (!session || session.session_status !== 'open') return null;

  const activas = ventas.filter((v) => v.estado !== 'anulada');
  const anuladas = ventas.filter((v) => v.estado === 'anulada');

  return (
    <div className="card-glow p-5 space-y-4">
      {pendingQueue.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-warning text-xs font-bold uppercase tracking-wider">
            <CloudOff className="w-3.5 h-3.5" />
            <span>Ventas locales pendientes de sync ({pendingQueue.length})</span>
          </div>
          <ul className="divide-y divide-border/40 text-xs">
            {pendingQueue.map((item) => {
              const payload = item.payload as Record<string, unknown>;
              const itemsOverride = Array.isArray(payload.items_override) ? payload.items_override : null;
              const cantidad = typeof payload.cantidad === 'number' ? payload.cantidad : 1;
              const metodoPago = typeof payload.metodo_pago === 'string' ? payload.metodo_pago : 'efectivo';
              const ch = typeof payload.channel === 'string' ? payload.channel : 'feria';

              return (
                <li key={item.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {itemsOverride
                        ? `${itemsOverride.length} productos en carrito`
                        : `${cantidad}× producto (${metodoPago})`}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Canal: {ch} · {new Date(item.created_at).toLocaleTimeString('es-CL')}
                    </p>
                  </div>
                  {item.id != null && (
                    <button
                      type="button"
                      onClick={() => setDescartarTargetId(item.id ?? null)}
                      className="px-2.5 py-1 rounded-lg border border-destructive/30 text-destructive text-[10px] font-bold uppercase tracking-wider hover:bg-destructive/10 inline-flex items-center gap-1 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                      Descartar
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-base text-foreground">Ventas sincronizadas</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Anular = devolución (stock + consignación)
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="text-xs text-primary hover:underline min-h-10"
          disabled={loading}
        >
          {loading ? '…' : 'Actualizar'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {error}
        </p>
      )}

      {activas.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground py-2">Sin ventas registradas en el servidor para esta sesión.</p>
      ) : (
        <ul className="divide-y divide-border/50 max-h-64 overflow-y-auto">
          {activas.map((v) => {
            const label =
              v.lines.length > 0
                ? v.lines.map((l) => `${l.cantidad}× ${l.nombre || l.producto_id.slice(0, 6)}`).join(', ')
                : 'Venta';
            return (
              <li key={v.id} className="py-2.5 flex items-center gap-3 justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {formatCLP(v.total)} · {v.metodo_pago || '—'} ·{' '}
                    {v.created_at
                      ? new Date(v.created_at).toLocaleTimeString('es-CL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAnularTargetId(v.id)}
                  disabled={voidingId === v.id}
                  className="shrink-0 min-h-10 px-3 rounded-full border border-destructive/30 text-destructive text-[10px] font-bold uppercase tracking-wider hover:bg-destructive/10 disabled:opacity-40 inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {voidingId === v.id ? '…' : 'Anular'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {anuladas.length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          {anuladas.length} anulada{anuladas.length === 1 ? '' : 's'} en esta sesión
        </p>
      )}

      <ConfirmDialog
        open={Boolean(anularTargetId)}
        onOpenChange={(open) => {
          if (!open) setAnularTargetId(null);
        }}
        title="Anular venta de feria"
        description="¿Seguro que deseas anular esta venta? Se restaurará el stock de los productos y la consignación asignada a la feria."
        confirmLabel="Anular venta"
        cancelLabel="Volver"
        variant="destructive"
        loading={Boolean(voidingId)}
        onConfirm={executeAnular}
      />

      <ConfirmDialog
        open={descartarTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDescartarTargetId(null);
        }}
        title="Descartar venta de la cola"
        description="¿Descartar esta venta local pendiente de sincronización? Esta acción no se puede deshacer."
        confirmLabel="Descartar venta"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={executeDescartar}
      />
    </div>
  );
}
