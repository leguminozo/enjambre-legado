'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@enjambre/auth';
import { useCashSession } from './cash-context';
import { formatCLP } from '@enjambre/ui';
import { RotateCcw, AlertTriangle } from 'lucide-react';

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
  const API_BASE = process.env.NEXT_PUBLIC_NUCLEO_API_URL || '';
  const [ventas, setVentas] = useState<SessionVenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [token, session?.id, API_BASE]);

  useEffect(() => {
    void load();
  }, [load]);

  const anular = async (id: string) => {
    if (!token) return;
    if (!window.confirm('¿Anular esta venta? Se restaura stock y consignación feria.')) return;
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al anular');
    } finally {
      setVoidingId(null);
    }
  };

  if (!session || session.session_status !== 'open') return null;

  const activas = ventas.filter((v) => v.estado !== 'anulada');
  const anuladas = ventas.filter((v) => v.estado === 'anulada');

  return (
    <div className="card-glow p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-base text-foreground">Ventas de la sesión</h3>
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
        <p className="text-sm text-muted-foreground py-2">Sin ventas en esta sesión.</p>
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
                  onClick={() => void anular(v.id)}
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
    </div>
  );
}
