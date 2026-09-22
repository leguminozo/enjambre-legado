'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, ViewLoading, formatCLP,
} from '@enjambre/ui';
import { AlertTriangle } from 'lucide-react';

interface CostoDetalleLinea {
  nombre?: string;
  costo_linea?: number;
}

interface CostoReceta {
  costo_ingredientes?: number;
  costo_merma?: number;
  costo_empaque?: number;
  costo_por_frasco?: number;
  precio_venta?: number;
  margen_por_frasco?: number;
  margen_pct?: number;
  detalle?: CostoDetalleLinea[];
}

// Paleta con tokens semánticos del tema (sin hex fijos).
const SEGMENT_VARS = [
  'var(--primary)',
  'var(--accent)',
  'var(--success)',
  'var(--warning)',
  'var(--chart-3, var(--accent))',
  'var(--chart-4, var(--primary))',
  'var(--chart-5, var(--muted-foreground))',
];

export interface EscandalloTortaProps {
  recetaId: string;
  nombre: string;
}

export function EscandalloTorta({ recetaId, nombre }: EscandalloTortaProps) {
  const apiFetch = useApiFetch();
  const [ocultos, setOcultos] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<CostoReceta>({
    queryKey: ['costeo', 'escandallo', recetaId],
    queryFn: async () => {
      const res = await apiFetch(`/api/costeo/recetas/${recetaId}/costo`);
      if (!res.ok) throw new Error('Error al calcular escandallo');
      const json = (await res.json()) as { data?: CostoReceta };
      return json.data ?? {};
    },
    enabled: Boolean(recetaId),
  });

  if (isLoading) return <ViewLoading variant="view" label="Escandallo" hideLabel />;
  if (!data) return null;

  const segmentos = [
    ...((data.detalle ?? []).map((linea, idx) => ({
      id: `ing-${idx}`,
      nombre: linea.nombre ?? `Insumo ${idx + 1}`,
      monto: Number(linea.costo_linea ?? 0),
    }))),
    { id: 'merma', nombre: 'Merma de proceso', monto: Number(data.costo_merma ?? 0) },
    { id: 'empaque', nombre: 'Empaque', monto: Number(data.costo_empaque ?? 0) },
  ].filter((s) => s.monto > 0);

  const total = segmentos.reduce((acc, s) => acc + s.monto, 0);
  const visibles = segmentos.filter((s) => !ocultos.has(s.id));
  const totalVisible = visibles.reduce((acc, s) => acc + s.monto, 0);

  let acumulado = 0;
  const stops = visibles.map((s, idx) => {
    const inicio = totalVisible > 0 ? (acumulado / totalVisible) * 100 : 0;
    acumulado += s.monto;
    const fin = totalVisible > 0 ? (acumulado / totalVisible) * 100 : 0;
    const color = SEGMENT_VARS[idx % SEGMENT_VARS.length];
    return `${color} ${inicio.toFixed(1)}% ${fin.toFixed(1)}%`;
  });

  const margenPct = Number(data.margen_pct ?? 0);
  const tone = margenPct >= 40 ? 'success' : margenPct >= 20 ? 'warning' : 'danger';

  const toggle = (id: string) => {
    setOcultos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Escandallo por frasco — {nombre}</CardTitle>
        <CardDescription>
          Breakdown real desde la receta (BOM). Toca un insumo para aislarlo del gráfico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {segmentos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Sin costos en la receta: completa precios de insumos en Inventario.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex justify-center">
              <div
                role="img"
                aria-label={`Distribución de costos de ${nombre}`}
                className="h-44 w-44 rounded-full border border-border"
                style={{ background: stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : 'hsl(var(--muted))' }}
              />
            </div>
            <div className="space-y-2 text-xs">
              {segmentos.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-opacity hover:bg-muted/40 ${ocultos.has(s.id) ? 'opacity-40' : ''}`}
                >
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ background: SEGMENT_VARS[idx % SEGMENT_VARS.length] }}
                  />
                  <span className="flex-1 truncate text-foreground">{s.nombre}</span>
                  <span className="font-mono text-muted-foreground">
                    {total > 0 ? Math.round((s.monto / total) * 100) : 0}%
                  </span>
                  <span className="font-mono font-semibold text-foreground">{formatCLP(s.monto)}</span>
                </button>
              ))}
              <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-semibold">
                <span className="text-foreground">Costo por frasco</span>
                <span className="font-mono text-foreground">{formatCLP(Number(data.costo_por_frasco ?? total))}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground">
                  Margen {formatCLP(Number(data.margen_por_frasco ?? 0))} · Venta {formatCLP(Number(data.precio_venta ?? 0))}
                </span>
                <Badge variant={tone}>{margenPct.toFixed(1)}%</Badge>
              </div>
              {tone === 'danger' && (
                <p className="flex items-start gap-1.5 text-xs text-destructive pt-1">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  Margen bajo el umbral (20%): revisa precio o renegocia insumos antes de descontar.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
