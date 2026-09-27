'use client';

import { useEffect, useState } from 'react';
import { Timer, Users } from 'lucide-react';
import { formatCLP, friendlyError } from '@enjambre/ui';
import type { EdicionActiva } from '@/lib/shop/edicion-activa';

function partesRestantes(cierraAt: string): { dias: number; horas: number; minutos: number; segundos: number } {
  const diff = Math.max(0, new Date(cierraAt).getTime() - Date.now());
  return {
    dias: Math.floor(diff / 86_400_000),
    horas: Math.floor((diff / 3_600_000) % 24),
    minutos: Math.floor((diff / 60_000) % 60),
    segundos: Math.floor((diff / 1000) % 60),
  };
}

/** Badge de edición limitada: countdown + cupos + reserva con early bird. */
export function EdicionBadge({ edicion, productoId }: { edicion: EdicionActiva; productoId: string }) {
  const [ahora, setAhora] = useState(() => Date.now());
  const [reservando, setReservando] = useState(false);
  const [reservado, setReservado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  void ahora;
  const resto = partesRestantes(edicion.cierra_at);
  const pct = Math.min(100, Math.round((edicion.cupo_usado / Math.max(1, edicion.cupo_max)) * 100));

  const reservar = async () => {
    setReservando(true);
    setError(null);
    try {
      const res = await fetch('/api/pre-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: productoId, quantity: 1, edicion_id: edicion.id }),
      });
      const json = await res.json().catch(() => ({})) as { error?: unknown };
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'No se pudo reservar');
      setReservado(true);
    } catch (err) {
      setError(friendlyError(err, 'No se pudo reservar. Intenta de nuevo en unos momentos.'));
    } finally {
      setReservando(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
        <Timer size={15} /> Edición limitada · {edicion.nombre}
      </p>
      <div className="flex items-center gap-3 font-mono text-sm text-foreground">
        <span>{resto.dias}d</span>
        <span>{String(resto.horas).padStart(2, '0')}h</span>
        <span>{String(resto.minutos).padStart(2, '0')}m</span>
        <span>{String(resto.segundos).padStart(2, '0')}s</span>
      </div>
      <div>
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
          <span className="inline-flex items-center gap-1">
            <Users size={12} /> {edicion.cupo_usado}/{edicion.cupo_max} reservados
          </span>
          <span className="font-mono font-semibold text-foreground">
            Early bird {formatCLP(edicion.precio_early_bird)}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {reservado ? (
        <p className="text-xs text-primary font-medium">
          ¡Cupo reservado! Te avisaremos para completar la compra con precio bloqueado.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void reservar()}
          disabled={reservando}
          className="w-full min-h-11 rounded-xl bg-primary px-4 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
        >
          {reservando ? 'Reservando…' : 'Reservar mi cupo'}
        </button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
