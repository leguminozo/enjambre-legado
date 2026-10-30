'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Input, Label, toast, SkeletonTable, ImmersiveModal, Badge,
} from '@enjambre/ui';
import { Droplets, Calendar, Plus, Link2 } from 'lucide-react';
import { CatalogoVacioCallout } from '@/components/shared/CatalogoVacioCallout';
import { supabase } from '@/lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface CosechaRow {
  id: string;
  kg: number | null;
  fecha: string | null;
  floracion: string | null;
  created_at: string | null;
  colmena_id: string | null;
  lote_id?: string | null;
  lote_nombre?: string | null;
  colmenas?: { id: string; name: string | null; apiarios?: { name: string | null } | null } | null;
}

interface CosechasResponse {
  data: CosechaRow[];
}

interface LoteLite {
  id: string;
  nombre_lote: string | null;
  kg_total: number | null;
  variedad_floral: string | null;
  n_cosechas?: number;
}

type LoteMode = 'nuevo' | 'existente' | 'ninguno';

/** Registro de recolecciones — alimenta lotes, pasaporte y panel ejecutivo */
export function RecoleccionPanel() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [kg, setKg] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [floracion, setFloracion] = useState('');
  const [colmenaId, setColmenaId] = useState('');
  const [loteMode, setLoteMode] = useState<LoteMode>('nuevo');
  const [loteExistenteId, setLoteExistenteId] = useState('');
  const [saving, setSaving] = useState(false);

  // Vincular sueltas a un lote
  const [vincularOpen, setVincularOpen] = useState(false);
  const [vincularCosechaIds, setVincularCosechaIds] = useState<string[]>([]);
  const [vincularLoteId, setVincularLoteId] = useState('');
  const [vinculando, setVinculando] = useState(false);

  const { data, isLoading, refetch } = useQuery<CosechasResponse>({
    queryKey: ['produccion', 'cosechas'],
    queryFn: async () => {
      const res = await apiFetch('/api/produccion/cosechas');
      if (!res.ok) throw new Error('Error al cargar recolecciones');
      return res.json() as Promise<CosechasResponse>;
    },
  });

  const { data: lotesLite } = useQuery<LoteLite[]>({
    queryKey: ['produccion', 'lotes-lite'],
    queryFn: async () => {
      const res = await apiFetch('/api/produccion/lotes');
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: LoteLite[] };
      return json.data ?? [];
    },
  });

  const { data: colmenas } = useQuery<{ id: string; name: string | null }[]>({
    queryKey: ['produccion', 'colmenas-lite'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('colmenas')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return (rows ?? []) as { id: string; name: string | null }[];
    },
  });

  const rows = data?.data ?? [];
  const totalKg = rows.reduce((acc, c) => acc + Number(c.kg ?? 0), 0);
  const sueltas = rows.filter((c) => !c.lote_id);
  const lotes = lotesLite ?? [];

  const resetForm = () => {
    setKg('');
    setFecha(new Date().toISOString().slice(0, 10));
    setFloracion('');
    setColmenaId('');
    setLoteMode('nuevo');
    setLoteExistenteId('');
  };

  const invalidate = () => {
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ['produccion', 'lotes-lite'] });
    void queryClient.invalidateQueries({ queryKey: ['produccion', 'dashboard'] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const kgNum = parseFloat(kg);
    if (!kgNum || kgNum <= 0) {
      toast.error('Ingresa un peso válido en kg');
      return;
    }
    if (!fecha) {
      toast.error('Ingresa la fecha de recolección');
      return;
    }
    if (loteMode === 'existente' && !loteExistenteId) {
      toast.error('Elige un lote existente o crea uno nuevo');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        kg: kgNum,
        fecha,
        floracion: floracion.trim() || null,
        colmena_id: colmenaId || null,
        lote_mode: loteMode,
      };

      if (loteMode === 'nuevo') {
        const nombreLote = `Recolección ${fecha}${floracion.trim() ? ` · ${floracion.trim()}` : ''}`;
        payload.nuevo_lote = {
          nombre_lote: nombreLote,
          variedad_floral: floracion.trim() || null,
        };
      } else if (loteMode === 'existente') {
        payload.lote_id = loteExistenteId;
      }

      const res = await apiFetch('/api/produccion/cosechas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
        throw new Error(err.message || err.code || 'Error al registrar recolección');
      }

      const msg =
        loteMode === 'nuevo'
          ? 'Lote creado y recolección vinculada'
          : loteMode === 'existente'
            ? 'Recolección vinculada al lote'
            : 'Recolección registrada (sin lote)';
      toast.success(msg);
      resetForm();
      setModalOpen(false);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar recolección');
    } finally {
      setSaving(false);
    }
  };

  const toggleVincularId = (id: string) => {
    setVincularCosechaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleVincular = async () => {
    if (!vincularLoteId || vincularCosechaIds.length === 0) {
      toast.error('Elige un lote y al menos una recolección suelta');
      return;
    }
    setVinculando(true);
    try {
      const res = await apiFetch(`/api/produccion/lotes/${vincularLoteId}/vincular-cosechas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cosecha_ids: vincularCosechaIds }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || 'No se pudo vincular');
      }
      const json = (await res.json()) as {
        data?: { linked?: string[]; failed?: unknown[] };
      };
      const n = json.data?.linked?.length ?? 0;
      toast.success(
        n === 1 ? '1 recolección vinculada al lote' : `${n} recolecciones vinculadas al lote`,
      );
      setVincularOpen(false);
      setVincularCosechaIds([]);
      setVincularLoteId('');
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al vincular');
    } finally {
      setVinculando(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Droplets size={18} className="text-primary" />
              Recolección de la Temporada
            </CardTitle>
            <CardDescription>
              {rows.length} registro(s) · Total:{' '}
              <span className="font-semibold text-foreground">{totalKg.toFixed(1)} kg</span>
              {sueltas.length > 0 && (
                <span className="text-warning"> · {sueltas.length} sin lote</span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {sueltas.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setVincularCosechaIds(sueltas.map((s) => s.id));
                  setVincularOpen(true);
                }}
              >
                <Link2 size={16} className="mr-2" />
                Vincular sueltas
              </Button>
            )}
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              Registrar Recolección
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay recolecciones registradas.</p>
          ) : (
            <div className="flex flex-col">
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-sunken text-xs uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                <div className="col-span-2">Fecha</div>
                <div className="col-span-2">Floración</div>
                <div className="col-span-3">Colmena / Apiario</div>
                <div className="col-span-3">Lote</div>
                <div className="col-span-2 text-right">Kg</div>
              </div>
              <div className="divide-y divide-border">
                {rows.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 md:px-6 items-center hover:bg-surface-sunken/50 transition-colors"
                  >
                    <div className="col-span-2 flex items-center gap-1.5 text-sm">
                      <Calendar size={14} className="hidden md:block text-muted-foreground" />
                      <span>
                        {c.fecha
                          ? new Date(`${c.fecha}T12:00:00`).toLocaleDateString('es-CL', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm">
                      {c.floracion || <span className="text-muted-foreground">—</span>}
                    </div>
                    <div className="col-span-3 text-sm text-muted-foreground">
                      {c.colmenas?.name || 'General'}
                      {c.colmenas?.apiarios?.name ? ` · ${c.colmenas.apiarios.name}` : ''}
                    </div>
                    <div className="col-span-3 text-sm">
                      {c.lote_id ? (
                        <Badge variant="success" className="font-normal max-w-full truncate">
                          {c.lote_nombre?.trim() || c.lote_id.slice(0, 8)}
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="font-normal">
                          Sin lote
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-2 text-right font-display text-lg">
                      {Number(c.kg ?? 0).toFixed(1)} kg
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ImmersiveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow="Producción"
        title="Registrar Recolección"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cada kg con colmena y lote alimenta el pasaporte del frasco (origen verificable).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="recoleccion-fecha">Fecha</Label>
              <Input
                id="recoleccion-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recoleccion-kg">Peso (kg)</Label>
              <Input
                id="recoleccion-kg"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="0.0"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recoleccion-floracion">Floración</Label>
            <Input
              id="recoleccion-floracion"
              placeholder="ej. Ulmo, Tepú…"
              value={floracion}
              onChange={(e) => setFloracion(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recoleccion-colmena">Colmena (recomendado para el pasaporte)</Label>
            <select
              id="recoleccion-colmena"
              value={colmenaId}
              onChange={(e) => setColmenaId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">General / Sin colmena</option>
              {(colmenas ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-1">
            <Label>Vínculo con lote</Label>
            <div className="flex flex-col gap-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lote-mode"
                  checked={loteMode === 'nuevo'}
                  onChange={() => setLoteMode('nuevo')}
                  className="accent-[hsl(var(--primary))]"
                />
                Crear lote nuevo con esta recolección
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lote-mode"
                  checked={loteMode === 'existente'}
                  onChange={() => setLoteMode('existente')}
                  className="accent-[hsl(var(--primary))]"
                />
                Sumar a un lote existente
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                <input
                  type="radio"
                  name="lote-mode"
                  checked={loteMode === 'ninguno'}
                  onChange={() => setLoteMode('ninguno')}
                  className="accent-[hsl(var(--primary))]"
                />
                Solo registrar (sin lote — no sale en pasaporte)
              </label>
            </div>
            {loteMode === 'existente' && (
              lotes.length === 0 ? (
                <div className="mt-2">
                  <CatalogoVacioCallout
                    title="No hay lotes existentes"
                    description="Crea un lote nuevo con esta recolección, o da de alta lotes en Producción."
                    href="/produccion/lotes"
                    goLabel="Ir a Lotes"
                    onNavigate={() => setModalOpen(false)}
                  />
                </div>
              ) : (
                <select
                  value={loteExistenteId}
                  onChange={(e) => setLoteExistenteId(e.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required={loteMode === 'existente'}
                >
                  <option value="">Selecciona un lote…</option>
                  {lotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {(l.nombre_lote || l.id.slice(0, 8)).trim()}
                      {l.variedad_floral ? ` · ${l.variedad_floral}` : ''}
                      {` · ${Number(l.kg_total ?? 0).toFixed(1)} kg`}
                    </option>
                  ))}
                </select>
              )
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || (loteMode === 'existente' && lotes.length === 0)}>
              <Plus size={16} className="mr-2" />
              {saving ? 'Registrando…' : 'Registrar recolección'}
            </Button>
          </div>
        </form>
      </ImmersiveModal>

      <ImmersiveModal
        open={vincularOpen}
        onClose={() => setVincularOpen(false)}
        eyebrow="Trazabilidad"
        title="Vincular recolecciones a un lote"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Las recolecciones sin lote no aparecen en el pasaporte del frasco. Elige destino y confirma.
          </p>
          <div className="space-y-1.5">
            <Label>Lote destino</Label>
            {lotes.length === 0 ? (
              <CatalogoVacioCallout
                title="No hay lotes para vincular"
                description="Crea un lote en Producción antes de anclar estas recolecciones al pasaporte."
                href="/produccion/lotes"
                goLabel="Ir a Lotes"
                onNavigate={() => setVincularOpen(false)}
              />
            ) : (
              <select
                value={vincularLoteId}
                onChange={(e) => setVincularLoteId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecciona…</option>
                {lotes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {(l.nombre_lote || l.id.slice(0, 8)).trim()}
                    {` · ${Number(l.kg_total ?? 0).toFixed(1)} kg`}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto border border-border rounded-md p-3">
            {sueltas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay recolecciones sueltas.</p>
            ) : (
              sueltas.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vincularCosechaIds.includes(c.id)}
                    onChange={() => toggleVincularId(c.id)}
                    className="accent-[hsl(var(--primary))]"
                  />
                  <span>
                    {c.fecha
                      ? new Date(`${c.fecha}T12:00:00`).toLocaleDateString('es-CL')
                      : '—'}{' '}
                    · {Number(c.kg ?? 0).toFixed(1)} kg
                    {c.floracion ? ` · ${c.floracion}` : ''}
                    {c.colmenas?.name ? ` · ${c.colmenas.name}` : ''}
                  </span>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setVincularOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={vinculando || !vincularLoteId || vincularCosechaIds.length === 0}
              onClick={() => void handleVincular()}
            >
              <Link2 size={16} className="mr-2" />
              {vinculando ? 'Vinculando…' : `Vincular (${vincularCosechaIds.length})`}
            </Button>
          </div>
        </div>
      </ImmersiveModal>
    </div>
  );
}
