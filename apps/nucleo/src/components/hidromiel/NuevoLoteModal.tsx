'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, ImmersiveModal, Input, Label, Select, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ESTADOS_SUGERIDOS, calcularOGEstimada } from '@/lib/hidromiel';
import type { LoteMielOpcion } from '@/components/hidromiel/types';

interface NuevoLoteModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

function parseNum(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Formulario mínimo: el resto del proceso se construye libremente en el detalle. */
export function NuevoLoteModal({ open, onClose, onCreated }: NuevoLoteModalProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [mielLoteId, setMielLoteId] = useState('');
  const [mielKg, setMielKg] = useState('');
  const [volumen, setVolumen] = useState('');
  const [estado, setEstado] = useState('fermentando');
  const [submitting, setSubmitting] = useState(false);

  // OG estimada en vivo (instrumento: no guarda nada, solo anticipa).
  const ogEstimada = useMemo(() => {
    const miel = parseNum(mielKg);
    const vol = parseNum(volumen);
    if (miel === null || vol === null) return null;
    return calcularOGEstimada(miel, vol);
  }, [mielKg, volumen]);

  // Lotes de miel de OYZ (trazabilidad OPCIONAL — vincular nunca es requisito).
  const lotesMiel = useQuery<{ data: LoteMielOpcion[] }>({
    queryKey: ['produccion', 'lotes'],
    queryFn: async () => {
      const res = await apiFetch('/api/produccion/lotes');
      if (!res.ok) throw new Error('Error cargando lotes de miel');
      return res.json();
    },
    enabled: open,
    staleTime: 60_000,
  });

  const opcionesMiel = useMemo(() => {
    const opciones = (lotesMiel.data?.data ?? []).map((l) => ({
      value: l.id,
      label: [l.nombre_lote, l.variedad_floral ? `· ${l.variedad_floral}` : '', l.kg_total != null ? `· ${l.kg_total} kg` : '']
        .filter(Boolean)
        .join(' '),
    }));
    return [{ value: '', label: 'Sin lote de miel (no vinculado)' }, ...opciones];
  }, [lotesMiel.data]);

  function reset() {
    setNombre('');
    setFecha('');
    setMielLoteId('');
    setMielKg('');
    setVolumen('');
    setEstado('fermentando');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const fechaISO = fecha
        ? new Date(`${fecha}T12:00:00`).toISOString()
        : undefined;
      const res = await apiFetch('/api/hidromiel/lotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim() || null,
          fecha_inicio: fechaISO,
          miel_lote_id: mielLoteId || null,
          estado: estado.trim() || 'fermentando',
          volumen_litros: parseNum(volumen),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message ?? 'Error creando el lote');
      }
      toast.success(`Lote ${json.data?.codigo ?? ''} creado`);
      queryClient.invalidateQueries({ queryKey: ['hidromiel'] });
      reset();
      onClose();
      onCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creando el lote');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      eyebrow="HIDROMIEL"
      title="Nuevo lote"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="nuevo-lote-form" disabled={submitting}>
            {submitting ? 'Creando…' : 'Crear lote'}
          </Button>
        </div>
      }
    >
      <form id="nuevo-lote-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="nl-nombre">Nombre del lote</Label>
          <Input
            id="nl-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Hidromiel Ulmo de enero"
            maxLength={200}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nl-fecha">Fecha de inicio</Label>
          <Input id="nl-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Lote de miel (opcional)</Label>
          <Select
            value={mielLoteId}
            onValueChange={setMielLoteId}
            options={opcionesMiel}
            placeholder="Sin lote de miel"
            searchable
          />
          <p className="text-xs text-muted-foreground">
            Vincular a un lote de OYZ habilita la trazabilidad colmena → botella. Nunca es obligatorio.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="nl-miel">Miel (kg)</Label>
            <Input
              id="nl-miel"
              inputMode="decimal"
              value={mielKg}
              onChange={(e) => setMielKg(e.target.value)}
              placeholder="3.5"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nl-volumen">Volumen (L)</Label>
            <Input
              id="nl-volumen"
              inputMode="decimal"
              value={volumen}
              onChange={(e) => setVolumen(e.target.value)}
              placeholder="10"
            />
          </div>
        </div>
        <div className="rounded-xl bg-surface-sunken px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">OG estimada (instrumento, no se guarda)</span>
          {ogEstimada !== null ? (
            <span className="text-lg font-bold text-foreground font-display tabular-nums">{ogEstimada.toFixed(4)}</span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nl-estado">Estado inicial</Label>
          <Input
            id="nl-estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            maxLength={120}
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ESTADOS_SUGERIDOS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setEstado(s)}
                className={`px-2 py-1 rounded-full text-[0.7rem] font-semibold capitalize transition-colors border ${
                  estado === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-surface-raised text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            El estado es texto libre: escribe el tuyo o usa las sugerencias.
          </p>
        </div>

        {estado && (
          <Badge variant="info" className="capitalize">
            {estado}
          </Badge>
        )}
      </form>
    </ImmersiveModal>
  );
}
