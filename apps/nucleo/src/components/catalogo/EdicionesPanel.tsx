'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast, friendlyError, formatCLP } from '@enjambre/ui';
import { Rocket, Pause, Play, CheckCheck } from 'lucide-react';

interface Edicion {
  id: string;
  producto_id: string;
  nombre: string;
  abre_at: string;
  cierra_at: string;
  cupo_max: number;
  cupo_usado: number;
  reservas: number;
  precio_early_bird: number;
  activa: boolean;
  productos?: { nombre: string; precio: number } | null;
}

interface ProductoOption {
  id: string;
  nombre: string;
  precio: number;
}

export function EdicionesPanel() {
  const apiFetch = useApiFetch();
  const [ediciones, setEdiciones] = useState<Edicion[]>([]);
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accionId, setAccionId] = useState<string | null>(null);
  const [form, setForm] = useState({
    producto_id: '',
    nombre: '',
    cierra_at: '',
    cupo_max: 50,
    precio_early_bird: 0,
    notificar: true,
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, pRes] = await Promise.all([
        apiFetch('/api/ediciones'),
        supabase.from('productos').select('id, nombre, precio').eq('visible', true).order('nombre').limit(100),
      ]);
      if (eRes.ok) {
        const json = (await eRes.json()) as { data?: Edicion[] };
        setEdiciones(json.data ?? []);
      }
      if (!pRes.error) {
        setProductos(((pRes.data ?? []) as ProductoOption[]).map((p) => ({
          id: p.id,
          nombre: p.nombre,
          precio: Number(p.precio) || 0,
        })));
      }
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const crear = async () => {
    if (!form.producto_id || !form.nombre.trim() || !form.cierra_at || form.cupo_max < 1 || form.precio_early_bird <= 0) {
      toast.error('Completa producto, nombre, cierre, cupo y precio early bird');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/api/ediciones', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || 'No se pudo crear');
      }
      const json = (await res.json()) as { notificados?: number };
      toast.success(
        typeof json.notificados === 'number' && json.notificados > 0
          ? `Edición creada y ${json.notificados} avisos encolados`
          : 'Edición creada',
      );
      setShowForm(false);
      await fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (e: Edicion) => {
    setAccionId(e.id);
    try {
      const res = await apiFetch(`/api/ediciones/${e.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activa: !e.activa }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar');
      await fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setAccionId(null);
    }
  };

  const confirmar = async (e: Edicion) => {
    if (!window.confirm(`¿Confirmar las ${e.cupo_usado} reservas de "${e.nombre}" con precio bloqueado?`)) return;
    setAccionId(e.id);
    try {
      const res = await apiFetch(`/api/ediciones/${e.id}/confirmar`, { method: 'POST' });
      if (!res.ok) throw new Error('No se pudo confirmar');
      const json = (await res.json()) as { data?: { confirmadas?: number } };
      toast.success(`${json.data?.confirmadas ?? 0} reservas confirmadas y avisadas`);
      await fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setAccionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Ediciones limitadas</h2>
          <p className="text-sm text-muted-foreground">
            Ventana, cupo y early bird. Al confirmar, cada reserva queda con precio bloqueado y aviso.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          <Rocket size={15} /> Nuevo lanzamiento
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs">
              <span className="text-muted-foreground block mb-1">Producto *</span>
              <select
                value={form.producto_id}
                onChange={(e) => setForm({ ...form, producto_id: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2.5 text-sm text-foreground"
              >
                <option value="">Seleccionar…</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} · {formatCLP(p.precio)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground block mb-1">Nombre del lanzamiento *</span>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Ulmo Reserva 2026 — 100 frascos"
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2.5 text-sm text-foreground"
              />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground block mb-1">Cierre de reservas *</span>
              <input
                type="datetime-local"
                value={form.cierra_at}
                onChange={(e) => setForm({ ...form, cierra_at: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2.5 text-sm text-foreground"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs">
                <span className="text-muted-foreground block mb-1">Cupo máx *</span>
                <input
                  type="number"
                  min={1}
                  value={form.cupo_max}
                  onChange={(e) => setForm({ ...form, cupo_max: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2.5 text-sm text-foreground"
                />
              </label>
              <label className="block text-xs">
                <span className="text-muted-foreground block mb-1">Early bird $ *</span>
                <input
                  type="number"
                  min={0}
                  value={form.precio_early_bird}
                  onChange={(e) => setForm({ ...form, precio_early_bird: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2.5 text-sm text-foreground"
                />
              </label>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={form.notificar}
              onChange={(e) => setForm({ ...form, notificar: e.target.checked })}
              className="h-4 w-4"
            />
            Avisar a Guardianes al crear (email, tope 200)
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-border px-4 py-2.5 text-xs text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void crear()}
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {saving ? 'Lanzando…' : 'Lanzar edición'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Cargando ediciones…</p>
      ) : ediciones.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Sin lanzamientos. Crea el primero para mieles de temporada con cupo real.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ediciones.map((e) => {
            const pct = e.cupo_max > 0 ? Math.min(100, Math.round((e.cupo_usado / e.cupo_max) * 100)) : 0;
            const cerrada = new Date(e.cierra_at).getTime() <= Date.now();
            return (
              <div key={e.id} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{e.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.productos?.nombre ?? 'Producto'} · early {formatCLP(e.precio_early_bird)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                      !e.activa
                        ? 'bg-surface-sunken text-muted-foreground'
                        : cerrada
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                    }`}
                  >
                    {!e.activa ? 'Pausada' : cerrada ? 'Cerrada' : 'Abierta'}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Cupo {e.cupo_usado}/{e.cupo_max}</span>
                    <span>Cierra {new Date(e.cierra_at).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void toggle(e)}
                    disabled={accionId === e.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium disabled:opacity-50"
                  >
                    {e.activa ? <Pause size={13} /> : <Play size={13} />}
                    {e.activa ? 'Pausar' : 'Reabrir'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmar(e)}
                    disabled={accionId === e.id || e.cupo_usado === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    <CheckCheck size={13} /> Confirmar reservas
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
