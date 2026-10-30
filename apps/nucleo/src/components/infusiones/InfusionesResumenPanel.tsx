'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, DataTable, Badge,
  SkeletonKpi, SkeletonTable, type ColumnDef,
} from '@enjambre/ui';
import {
  fmtKg, fmtPct, fmtFecha, LOTE_ORIGEN_LABEL,
  type InfusionesDashboard, type StockSecoRow,
} from '@/lib/infusiones-types';

const stockColumns: ColumnDef<StockSecoRow>[] = [
  { key: 'materia_prima', header: 'Materia prima', sortable: true, render: (s) => <span className="font-medium text-foreground">{s.materia_prima}</span>, csvValue: (s) => s.materia_prima },
  { key: 'total_seco_kg', header: 'Total seco', sortable: true, align: 'right', render: (s) => fmtKg(s.total_seco_kg), csvValue: (s) => String(s.total_seco_kg) },
  { key: 'consumido_kg', header: 'Consumido', sortable: true, align: 'right', render: (s) => fmtKg(s.consumido_kg), csvValue: (s) => String(s.consumido_kg) },
  {
    key: 'stock_disponible_kg',
    header: 'Disponible',
    sortable: true,
    align: 'right',
    render: (s) => (
      <span className={Number(s.stock_disponible_kg) <= 0 ? 'text-muted-foreground' : 'text-success font-medium'}>
        {fmtKg(s.stock_disponible_kg)}
      </span>
    ),
    csvValue: (s) => String(s.stock_disponible_kg),
  },
];

/** Resumen del módulo: el dato central es cuánta materia fresca entró vs. cuánta seca se registró. */
export function InfusionesResumenPanel() {
  const apiFetch = useApiFetch();

  const { data, isLoading } = useQuery<{ data: InfusionesDashboard }>({
    queryKey: ['infusiones', 'dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/infusiones/dashboard');
      if (!res.ok) throw new Error('Error al cargar el resumen');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonKpi key={i} />
          ))}
        </div>
        <SkeletonTable rows={5} columns={4} />
      </div>
    );
  }

  const d = data?.data;
  const kpis = d?.kpis;

  const metricas = [
    { label: 'Materia fresca total', value: fmtKg(kpis?.total_fresco_kg), hint: 'kg que entraron (recolección/compra/cultivo)' },
    { label: 'Materia seca registrada', value: fmtKg(kpis?.total_seco_kg), hint: 'kg deshidratados de salida' },
    { label: 'Rendimiento promedio', value: fmtPct(kpis?.rendimiento_promedio_pct), hint: 'seco / fresco · 100' },
    { label: 'Sachets producidos', value: (kpis?.sachets_producidos ?? 0).toLocaleString('es-CL'), hint: 'unidades salidas de producción' },
    { label: 'Pendientes de deshidratar', value: String(kpis?.lotes_pendientes_deshidratar ?? 0), hint: 'lotes de entrada sin proceso' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {metricas.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{m.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{m.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock seco disponible</CardTitle>
          <CardDescription>Total deshidratado menos lo consumido en producción, por materia prima.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<StockSecoRow>
            columns={stockColumns}
            rows={d?.stock_seco ?? []}
            getId={(s) => s.materia_prima_id}
            sortable
            exportable
            columnsControl
            storageKey="infusiones-stock-seco"
            exportFilename="infusiones-stock-seco"
            emptyState="Aún no hay materia deshidratada registrada."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimas entradas</CardTitle>
          <CardDescription>Los lotes frescos más recientes y su estado en la cadena.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={[
              { key: 'codigo_lote', header: 'Código', sortable: true, render: (r) => <span className="font-mono text-sm font-medium text-primary">{r.codigo_lote}</span>, csvValue: (r) => r.codigo_lote },
              { key: 'materia_prima', header: 'Materia prima', sortable: true, render: (r) => r.materia_prima, csvValue: (r) => r.materia_prima },
              { key: 'fecha', header: 'Fecha', sortable: true, hideBelow: 480, render: (r) => fmtFecha(r.fecha), csvValue: (r) => r.fecha },
              { key: 'peso_fresco_kg', header: 'Fresco', sortable: true, align: 'right', render: (r) => fmtKg(r.peso_fresco_kg), csvValue: (r) => String(r.peso_fresco_kg ?? '') },
              { key: 'origen', header: 'Origen', sortable: true, hideBelow: 560, render: (r) => LOTE_ORIGEN_LABEL[r.origen] ?? r.origen, csvValue: (r) => r.origen },
              {
                key: 'estado',
                header: 'Estado',
                hideBelow: 640,
                render: (r) => (
                  r.deshidratado
                    ? <Badge variant="success">Deshidratado</Badge>
                    : <Badge variant="warning">Pendiente</Badge>
                ),
                csvValue: (r) => (r.deshidratado ? 'deshidratado' : 'pendiente'),
              },
            ]}
            rows={d?.ultimas_entradas ?? []}
            getId={(r) => r.id}
            storageKey="infusiones-ultimas-entradas"
            emptyState="Aún no hay entradas registradas."
          />
        </CardContent>
      </Card>
    </div>
  );
}
