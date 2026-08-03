'use client';

import { useCallback, useEffect, useState } from 'react';
import { Wallet, Loader2, Check } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface ResumenRep {
  rep_id: string;
  nombre: string | null;
  ganado: number;
  pagado: number;
  pendiente: number;
  nTotal: number;
  nPendientes: number;
}

function formatCLP(v: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
}

/** Liquidación de comisiones — cierra el ciclo: lo ganado se paga y queda registrado. */
export function LiquidacionComisiones() {
  const apiFetch = useApiFetch();
  const [resumen, setResumen] = useState<ResumenRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [liquidando, setLiquidando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await apiFetch('/api/comisiones/resumen');
      if (res.ok) {
        const j = await res.json();
        setResumen(j.data ?? []);
      }
    } catch {
      /* el panel sigue funcionando sin el resumen */
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const liquidar = async (repId: string | null) => {
    setLiquidando(repId ?? 'todos');
    setMensaje(null);
    try {
      const res = await apiFetch('/api/comisiones/liquidar', {
        method: 'POST',
        body: JSON.stringify(repId ? { rep_id: repId } : {}),
      });
      if (res.ok) {
        const j = await res.json();
        setMensaje(`Liquidado: ${j.data?.count ?? 0} comisiones por ${formatCLP(j.data?.monto ?? 0)} ✓`);
        await cargar();
      } else {
        const j = await res.json().catch(() => null);
        setMensaje(j?.message ?? 'Error al liquidar');
      }
    } catch {
      setMensaje('Error de red al liquidar');
    } finally {
      setLiquidando(null);
    }
  };

  const totalPendiente = resumen.reduce((a, r) => a + r.pendiente, 0);
  const totalGanado = resumen.reduce((a, r) => a + r.ganado, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-accent" />
          <span className="section-title text-foreground">Liquidación de Comisiones</span>
        </div>
        <span className="text-sm font-datos text-muted-foreground">
          Pendiente: <span className="text-warning font-semibold">{formatCLP(totalPendiente)}</span>
          {' '}· Ganado: {formatCLP(totalGanado)}
        </span>
      </div>

      {mensaje && (
        <p className={`text-sm ${mensaje.includes('✓') ? 'text-success' : 'text-destructive'}`}>{mensaje}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando comisiones…</p>
      ) : resumen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin comisiones registradas aún.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 pr-3">Rep</th>
                <th className="py-2 pr-3 text-right">Ganado</th>
                <th className="py-2 pr-3 text-right">Pagado</th>
                <th className="py-2 pr-3 text-right">Pendiente</th>
                <th className="py-2 pr-3 text-center">Ventas</th>
                <th className="py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {resumen.map((r) => (
                <tr key={r.rep_id} className="border-b border-border/40">
                  <td className="py-2.5 pr-3 font-medium text-foreground">{r.nombre ?? 'Sin nombre'}</td>
                  <td className="py-2.5 pr-3 text-right font-datos">{formatCLP(r.ganado)}</td>
                  <td className="py-2.5 pr-3 text-right font-datos text-success">{formatCLP(r.pagado)}</td>
                  <td className={`py-2.5 pr-3 text-right font-datos ${r.pendiente > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {formatCLP(r.pendiente)}
                  </td>
                  <td className="py-2.5 pr-3 text-center font-datos text-muted-foreground">{r.nTotal}</td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      disabled={r.pendiente <= 0 || liquidando === r.rep_id}
                      onClick={() => void liquidar(r.rep_id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40 text-xs font-medium"
                    >
                      {liquidando === r.rep_id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Liquidar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPendiente > 0 && (
        <button
          type="button"
          disabled={liquidando !== null}
          onClick={() => void liquidar(null)}
          className="px-4 py-2 rounded-md bg-accent text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-40 text-sm"
        >
          {liquidando === 'todos' ? 'Liquidando todo…' : `Liquidar todo lo pendiente (${formatCLP(totalPendiente)})`}
        </button>
      )}
    </div>
  );
}
