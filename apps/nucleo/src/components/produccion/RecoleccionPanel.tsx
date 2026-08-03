'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Input, Label, toast, ViewLoading,
} from '@enjambre/ui';
import { Droplets, Calendar, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface CosechaRow {
  id: string;
  kg: number | null;
  fecha: string | null;
  floracion: string | null;
  created_at: string | null;
  colmena_id: string | null;
  colmenas?: { id: string; name: string | null; apiarios?: { name: string | null } | null } | null;
}

interface CosechasResponse {
  data: CosechaRow[];
}

/** Registro de recolecciones de la temporada — alimenta Panel Ejecutivo y stats de producción */
export function RecoleccionPanel() {
  const apiFetch = useApiFetch();
  const [kg, setKg] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [floracion, setFloracion] = useState('');
  const [colmenaId, setColmenaId] = useState('');
  const [crearLote, setCrearLote] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery<CosechasResponse>({
    queryKey: ['produccion', 'cosechas'],
    queryFn: async () => {
      const res = await apiFetch('/api/produccion/cosechas');
      if (!res.ok) throw new Error('Error al cargar cosechas');
      return res.json() as Promise<CosechasResponse>;
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
    setSaving(true);
    try {
      // Pipeline recolección → lote: si se marca, primero se crea el lote y
      // la recolección queda vinculada (lote_id) para la trazabilidad.
      let loteId: string | null = null;
      if (crearLote) {
        const nombreLote = `Recolección ${fecha}${floracion.trim() ? ` · ${floracion.trim()}` : ''}`;
        const loteRes = await apiFetch('/api/produccion/lotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre_lote: nombreLote,
            kg_total: kgNum,
            variedad_floral: floracion.trim() || null,
            fecha,
          }),
        });
        if (!loteRes.ok) {
          const err = (await loteRes.json().catch(() => ({}))) as { message?: string; code?: string };
          throw new Error(err.message || err.code || 'Error al crear el lote');
        }
        const loteJson = (await loteRes.json()) as { data?: { id?: string } };
        loteId = loteJson.data?.id ?? null;
      }

      const res = await apiFetch('/api/produccion/cosechas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kg: kgNum,
          fecha,
          floracion: floracion.trim() || null,
          colmena_id: colmenaId || null,
          lote_id: loteId,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
        throw new Error(err.message || err.code || 'Error al registrar recolección');
      }
      toast.success(loteId ? 'Lote creado y recolección vinculada' : 'Recolección registrada');
      setKg('');
      setFloracion('');
      setColmenaId('');
      void refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar recolección');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets size={18} className="text-primary" />
            Registrar Recolección
          </CardTitle>
          <CardDescription>
            Cierra la temporada con números reales: cada kg recolectado alimenta el Panel Ejecutivo y la trazabilidad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cosecha-fecha">Fecha</Label>
              <Input
                id="cosecha-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cosecha-kg">Peso (kg)</Label>
              <Input
                id="cosecha-kg"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="0.0"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cosecha-floracion">Floración</Label>
              <Input
                id="cosecha-floracion"
                placeholder="ej. Ulmo, Tepú…"
                value={floracion}
                onChange={(e) => setFloracion(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cosecha-colmena">Colmena (opcional)</Label>
              <select
                id="cosecha-colmena"
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
            <div className="md:col-span-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={crearLote}
                  onChange={(e) => setCrearLote(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
                />
                Crear lote con esta recolección
              </label>
              <Button type="submit" disabled={saving}>
                <Plus size={16} className="mr-2" />
                {saving ? 'Registrando…' : 'Registrar recolección'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Recolección de la Temporada</CardTitle>
            <CardDescription>
              {rows.length} registro(s) · Total:{' '}
              <span className="font-semibold text-foreground">{totalKg.toFixed(1)} kg</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <ViewLoading variant="inline" label="Recolección" hideLabel />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay recolecciones registradas.</p>
          ) : (
            <div className="flex flex-col">
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-sunken text-xs uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                <div className="col-span-3">Fecha</div>
                <div className="col-span-3">Floración</div>
                <div className="col-span-3">Colmena / Apiario</div>
                <div className="col-span-3 text-right">Kg</div>
              </div>
              <div className="divide-y divide-border">
                {rows.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 md:px-6 items-center hover:bg-surface-sunken/50 transition-colors"
                  >
                    <div className="col-span-3 flex items-center gap-1.5 text-sm">
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
                    <div className="col-span-3 text-sm">
                      {c.floracion || <span className="text-muted-foreground">—</span>}
                    </div>
                    <div className="col-span-3 text-sm text-muted-foreground">
                      {c.colmenas?.name || 'General'}
                      {c.colmenas?.apiarios?.name ? ` · ${c.colmenas.apiarios.name}` : ''}
                    </div>
                    <div className="col-span-3 text-right font-display text-lg">
                      {Number(c.kg ?? 0).toFixed(1)} kg
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
