'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Badge,
  Select, ViewLoading, type ColumnDef,
} from '@enjambre/ui';
import { useMicrocanalResource } from './use-microcanales';
import { type PuntoVentaRow, type SesionPercepcionRow, type PercepcionAgregado } from '@/lib/microcanales-types';

const BLOQUE_LABEL: Record<string, string> = {
  sabor: 'Sabor', aroma: 'Aroma', textura: 'Textura', color: 'Color',
}

export function PercepcionPanel() {
  const apiFetch = useApiFetch();
  const { items: puntos } = useMicrocanalResource<PuntoVentaRow>('puntos-venta');
  const [puntoId, setPuntoId] = useState('');

  const query = useQuery<{ data: PercepcionAgregado }>({
    queryKey: ['microcanales', 'percepcion', puntoId],
    queryFn: async () => {
      const res = await apiFetch(`/api/percepcion/sesiones?punto_id=${puntoId}`);
      if (!res.ok) throw new Error('Error al cargar percepción');
      return res.json();
    },
    enabled: Boolean(puntoId),
  });

  const d = query.data?.data;

  const sesionesColumns: ColumnDef<SesionPercepcionRow>[] = [
    { key: 'created_at', header: 'Fecha', sortable: true, render: (s) => new Date(s.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }), csvValue: (s) => s.created_at },
    { key: 'agrado_1_5', header: 'Agrado', sortable: true, align: 'right', render: (s) => (s.agrado_1_5 != null ? `${s.agrado_1_5}/5` : '—'), csvValue: (s) => String(s.agrado_1_5 ?? '') },
    { key: 'recompra', header: 'Recompra', sortable: true, hideBelow: 560, render: (s) => (s.intencion_recompra == null ? '—' : s.intencion_recompra ? 'Sí' : 'No'), csvValue: (s) => String(s.intencion_recompra ?? '') },
    { key: 'evaluador', header: 'Evaluador', sortable: true, hideBelow: 700, render: (s) => (s.tipo_evaluador === 'semi_entrenado' ? <Badge variant="warning">Semi-entrenado</Badge> : <Badge variant="default">Consumidor</Badge>), csvValue: (s) => s.tipo_evaluador },
    { key: 'pares', header: 'Pares', hideBelow: 820, render: (s) => (
      <span className="text-xs text-muted-foreground">{(s.pares ?? []).map((p) => `${p.par}: ${p.valor}`).join(' · ') || '—'}</span>), csvValue: (s) => (s.pares ?? []).map((p) => `${p.par}:${p.valor}`).join(' | ') },
    { key: 'chips', header: 'Chips', hideBelow: 900, render: (s) => (
      <span className="text-xs text-muted-foreground">{(s.chips ?? []).map((c) => c.chip).join(', ') || '—'}</span>), csvValue: (s) => (s.chips ?? []).map((c) => c.chip).join(', ') },
  ];

  const paresColumns: ColumnDef<{ par: string; promedio: number; n: number }>[] = [
    { key: 'par', header: 'Par semántico', sortable: true, render: (p) => <span className="font-medium text-foreground">{p.par}</span>, csvValue: (p) => p.par },
    { key: 'promedio', header: 'Promedio', sortable: true, align: 'right', render: (p) => p.promedio.toLocaleString('es-CL'), csvValue: (p) => String(p.promedio) },
    { key: 'n', header: 'N', sortable: true, align: 'right', render: (p) => p.n, csvValue: (p) => String(p.n) },
  ];

  const chipsColumns: ColumnDef<{ bloque: string; chip: string; n: number }>[] = [
    { key: 'bloque', header: 'Bloque', sortable: true, render: (c) => <Badge variant="default">{BLOQUE_LABEL[c.bloque] ?? c.bloque}</Badge>, csvValue: (c) => c.bloque },
    { key: 'chip', header: 'Chip', sortable: true, render: (c) => c.chip, csvValue: (c) => c.chip },
    { key: 'n', header: 'Frecuencia', sortable: true, align: 'right', render: (c) => c.n, csvValue: (c) => String(c.n) },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Percepción semántica</CardTitle>
          <CardDescription>
            Sesiones del instrumento CATA por punto de venta.
            {d && (d.perfil_listo
              ? <span className="text-success"> · Perfil listo ({d.n} sesiones ≥ umbral {d.umbral_perfil})</span>
              : <span className="text-muted-foreground"> · Perfil en construcción ({d.n}/{d.umbral_perfil} sesiones — honestidad estadística: bajo el umbral no se publica perfil)</span>)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-72">
            <SelectPunto puntos={puntos} value={puntoId} onChange={setPuntoId} />
          </div>
          {!puntoId && <p className="text-sm text-muted-foreground">Selecciona un punto de venta para ver su percepción.</p>}
          {query.isLoading && puntoId && <ViewLoading variant="view" label="Percepción" hideLabel />}
          {d && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Pares semánticos (promedio)</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <DataTable columns={paresColumns} rows={d.pares_promedio} getId={(p) => p.par}
                      storageKey="microcanales-pares" emptyState="Sin pares aún." />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Chips CATA (frecuencia)</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <DataTable columns={chipsColumns} rows={d.chips_frecuencia} getId={(c) => `${c.bloque}:${c.chip}`}
                      storageKey="microcanales-chips-frec" emptyState="Sin chips aún." />
                  </CardContent>
                </Card>
              </div>
              <DataTable<SesionPercepcionRow> columns={sesionesColumns} rows={d.sesiones} getId={(s) => s.id}
                storageKey="microcanales-sesiones" emptyState="Aún no hay sesiones de percepción." />
              {d.abiertas_recientes.length > 0 && (
                <div>
                  <h4 className="text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Palabras libres recientes («¿A qué te recuerda?»)</h4>
                  <div className="flex flex-wrap gap-2">
                    {d.abiertas_recientes.map((a, i) => (
                      <span key={i} className="rounded-full border border-border bg-surface-sunken/50 px-3 py-1 text-sm text-foreground/90">
                        &ldquo;{a.texto}&rdquo;
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SelectPunto({ puntos, value, onChange }: {
  puntos: PuntoVentaRow[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}
      options={puntos.map((p) => ({ value: p.id, label: p.nombre }))}
      placeholder="Seleccionar punto de venta…" searchable />
  );
}
