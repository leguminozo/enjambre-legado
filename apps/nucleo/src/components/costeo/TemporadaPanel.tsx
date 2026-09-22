'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, ViewLoading, formatCLP,
} from '@enjambre/ui';

interface TemporadaDato {
  ventas: number;
  unidades: number;
  ingreso: number;
  unidades_con_costo: number;
  costo: number;
  margen: number;
}

const TEMPORADAS = [
  { key: 'verano', nombre: 'Verano', detalle: 'Dic · Ene · Feb' },
  { key: 'otono', nombre: 'Otoño', detalle: 'Mar · Abr · May' },
  { key: 'invierno', nombre: 'Invierno', detalle: 'Jun · Jul · Ago' },
  { key: 'primavera', nombre: 'Primavera', detalle: 'Sep · Oct · Nov' },
];

export function TemporadaPanel() {
  const apiFetch = useApiFetch();

  const { data, isLoading } = useQuery<Record<string, TemporadaDato>>({
    queryKey: ['costeo', 'temporada'],
    queryFn: async () => {
      const res = await apiFetch('/api/costeo/temporada');
      if (!res.ok) throw new Error('Error al obtener temporadas');
      const json = (await res.json()) as { data?: Record<string, TemporadaDato> };
      return json.data ?? {};
    },
  });

  if (isLoading) return <ViewLoading variant="view" label="Temporadas" hideLabel />;

  const maxIngreso = Math.max(1, ...TEMPORADAS.map((t) => data?.[t.key]?.ingreso ?? 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Margen realizado por temporada</CardTitle>
        <CardDescription>
          Últimos 12 meses por estación austral. El margen usa costo de receta; líneas sin receta no aportan
          (ver cobertura).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {TEMPORADAS.map((t) => {
            const d = data?.[t.key];
            const margenPct = d && d.ingreso > 0 ? (d.margen / d.ingreso) * 100 : 0;
            const cobertura = d && d.unidades > 0 ? (d.unidades_con_costo / d.unidades) * 100 : 0;
            return (
              <div key={t.key} className="rounded-xl border border-border/60 p-4 space-y-3">
                <div>
                  <p className="font-semibold text-foreground">{t.nombre}</p>
                  <p className="text-[11px] text-muted-foreground">{t.detalle}</p>
                </div>
                {!d || d.ventas === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin ventas en el período.</p>
                ) : (
                  <>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, (d.ingreso / maxIngreso) * 100)}%` }}
                      />
                    </div>
                    <dl className="space-y-1.5 text-xs tabular-nums">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Ventas</dt>
                        <dd className="font-medium text-foreground">{d.ventas}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Ingreso</dt>
                        <dd className="font-medium text-foreground">{formatCLP(d.ingreso)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Costo</dt>
                        <dd className="font-medium text-destructive">{formatCLP(d.costo)}</dd>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-1.5">
                        <dt className="font-semibold text-foreground">Margen</dt>
                        <dd className="font-mono font-bold text-success">
                          {formatCLP(d.margen)} · {margenPct.toFixed(1)}%
                        </dd>
                      </div>
                    </dl>
                    <p className="text-[11px] text-muted-foreground">
                      Cobertura de recetas: {cobertura.toFixed(0)}% de las unidades.
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
