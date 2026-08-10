'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Button,
  Input, Select, ViewLoading, formatCLP, type ColumnDef,
} from '@enjambre/ui';
import { useInfusionResource } from './use-infusiones';
import { FormFieldLabel } from './shared';
import {
  fmtKg, fmtPct, FORMULA_TIPO_LABEL,
  type CostoMateriaRow, type CostoFormulaRow, type PlanificacionResponse, type FormulaRow,
} from '@/lib/infusiones-types';

const fmtClp = (v: number | null | undefined): string => (v == null ? '—' : formatCLP(v))

function CostosFormulaTable({ rows }: { rows: CostoFormulaRow[] }) {
  const columns: ColumnDef<CostoFormulaRow>[] = [
    { key: 'nombre', header: 'Fórmula', sortable: true, render: (f) => <span className="font-medium text-foreground">{f.nombre}</span>, csvValue: (f) => f.nombre },
    { key: 'tipo', header: 'Formato', sortable: true, hideBelow: 560, render: (f) => FORMULA_TIPO_LABEL[f.tipo] ?? f.tipo, csvValue: (f) => f.tipo },
    { key: 'gramaje_sachet_g', header: 'Sachet (g)', sortable: true, align: 'right', hideBelow: 480, render: (f) => f.gramaje_sachet_g.toLocaleString('es-CL'), csvValue: (f) => String(f.gramaje_sachet_g) },
    { key: 'costo_kg_mezcla_clp', header: 'Costo kg mezcla', sortable: true, align: 'right', render: (f) => fmtClp(f.costo_kg_mezcla_clp), csvValue: (f) => String(f.costo_kg_mezcla_clp ?? '') },
    {
      key: 'costo_sachet_clp',
      header: 'Costo por sachet',
      sortable: true,
      align: 'right',
      render: (f) => (
        <span className={f.costo_sachet_clp != null ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
          {fmtClp(f.costo_sachet_clp)}
        </span>
      ),
      csvValue: (f) => String(f.costo_sachet_clp ?? ''),
    },
  ]
  return (
    <DataTable<CostoFormulaRow>
      columns={columns}
      rows={rows}
      getId={(f) => f.id}
      sortable
      exportable
      columnsControl
      storageKey="infusiones-costos-formulas"
      exportFilename="infusiones-costos-sachet"
      emptyState="Aún no hay fórmulas activas."
    />
  )
}

function Planificador({ formulas }: { formulas: FormulaRow[] }) {
  const apiFetch = useApiFetch();
  const [formulaId, setFormulaId] = useState('')
  const [sachets, setSachets] = useState('')

  const sachetsNum = Number(sachets)
  const planQuery = useQuery<{ data: PlanificacionResponse }>({
    queryKey: ['infusiones', 'planificacion', formulaId, sachets],
    queryFn: async () => {
      const res = await apiFetch(`/api/infusiones/planificacion?formula_id=${formulaId}&sachets=${encodeURIComponent(sachets)}`)
      if (!res.ok) throw new Error('Error al calcular la planificación')
      return res.json()
    },
    enabled: Boolean(formulaId) && sachets !== '' && sachetsNum > 0,
  })

  const plan = planQuery.data?.data
  const formulaSel = formulas.find((f) => f.id === formulaId)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 space-y-2">
          <FormFieldLabel>Fórmula</FormFieldLabel>
          <Select
            value={formulaId}
            onValueChange={setFormulaId}
            options={formulas.map((f) => ({ value: f.id, label: `${f.nombre} · ${f.gramaje_sachet_g.toLocaleString('es-CL')} g/sachet` }))}
            placeholder="Seleccionar fórmula…"
            searchable
          />
        </div>
        <div className="w-full sm:w-40 space-y-2">
          <FormFieldLabel>Sachets objetivo</FormFieldLabel>
          <Input type="number" step="1" min="1" value={sachets} onChange={(e) => setSachets(e.target.value)} placeholder="600" />
        </div>
        {plan && (
          <div className="text-sm text-muted-foreground pb-1">
            {fmtKg(plan.total_seco_necesario_kg)} de mezcla seca
            {plan.total_fresco_sugerido_kg != null && <> · fresco a recolectar ≈ <span className="font-medium text-foreground">{fmtKg(plan.total_fresco_sugerido_kg)}</span></>}
          </div>
        )}
      </div>

      {planQuery.isLoading && <ViewLoading variant="view" label="Planificación" hideLabel />}
      {planQuery.isError && <p className="text-sm text-destructive">No se pudo calcular la planificación.</p>}

      {plan && plan.por_ingrediente.length > 0 && (
        <DataTable
          columns={[
            { key: 'materia_prima', header: 'Materia prima', sortable: true, render: (r) => <span className="font-medium text-foreground">{r.materia_prima}</span>, csvValue: (r) => r.materia_prima },
            { key: 'porcentaje', header: '% mezcla', sortable: true, align: 'right', render: (r) => `${r.porcentaje.toLocaleString('es-CL', { maximumFractionDigits: 1 })}%`, csvValue: (r) => String(r.porcentaje) },
            { key: 'seco_necesario_kg', header: 'Seco necesario', sortable: true, align: 'right', render: (r) => fmtKg(r.seco_necesario_kg), csvValue: (r) => String(r.seco_necesario_kg) },
            { key: 'disponible_kg', header: 'Disponible', sortable: true, align: 'right', render: (r) => fmtKg(r.disponible_kg), csvValue: (r) => String(r.disponible_kg) },
            { key: 'deficit_kg', header: 'Déficit', sortable: true, align: 'right', render: (r) => (r.deficit_kg > 0 ? <span className="text-destructive font-medium">{fmtKg(r.deficit_kg)}</span> : <span className="text-success">—</span>), csvValue: (r) => String(r.deficit_kg) },
            { key: 'rendimiento_pct', header: 'Rend. hist.', sortable: true, align: 'right', hideBelow: 560, render: (r) => fmtPct(r.rendimiento_pct), csvValue: (r) => String(r.rendimiento_pct ?? '') },
            {
              key: 'fresco_a_recolectar_kg',
              header: 'Fresco a recolectar',
              sortable: true,
              align: 'right',
              hideBelow: 700,
              render: (r) => (
                r.fresco_a_recolectar_kg != null
                  ? <span className="font-medium text-primary">{fmtKg(r.fresco_a_recolectar_kg)}</span>
                  : <span className="text-xs text-muted-foreground">sin historial</span>
              ),
              csvValue: (r) => String(r.fresco_a_recolectar_kg ?? ''),
            },
          ]}
          rows={plan.por_ingrediente}
          getId={(r) => r.materia_prima_id}
          sortable
          exportable
          storageKey="infusiones-planificacion"
          exportFilename="infusiones-planificacion"
        />
      )}
      {formulaSel && plan && plan.por_ingrediente.length === 0 && (
        <p className="text-sm text-muted-foreground">Esta fórmula no tiene ingredientes — agrégale receta primero.</p>
      )}
    </div>
  )
}

function CostosMateriaTable({ rows }: { rows: CostoMateriaRow[] }) {
  const columns: ColumnDef<CostoMateriaRow>[] = [
    { key: 'materia_prima', header: 'Materia prima', sortable: true, render: (m) => <span className="font-medium text-foreground">{m.materia_prima}</span>, csvValue: (m) => m.materia_prima },
    { key: 'costo_seco_kg_clp', header: 'Costo seco/kg', sortable: true, align: 'right', render: (m) => fmtClp(m.costo_seco_kg_clp), csvValue: (m) => String(m.costo_seco_kg_clp ?? '') },
    { key: 'rendimiento_promedio_pct', header: 'Rend. promedio', sortable: true, align: 'right', render: (m) => fmtPct(m.rendimiento_promedio_pct), csvValue: (m) => String(m.rendimiento_promedio_pct ?? '') },
    { key: 'lotes_con_costo', header: 'Lotes con costo', sortable: true, align: 'right', hideBelow: 560, render: (m) => m.lotes_con_costo, csvValue: (m) => String(m.lotes_con_costo) },
  ]
  return (
    <DataTable<CostoMateriaRow>
      columns={columns}
      rows={rows}
      getId={(m) => m.materia_prima_id}
      sortable
      exportable
      columnsControl
      storageKey="infusiones-costos-materias"
      exportFilename="infusiones-costos-materias"
      emptyState="Aún no hay materias primas."
    />
  )
}

/** Costos reales por sachet y planificación de recolección según rendimiento histórico. */
export function CostosPlanPanel() {
  const apiFetch = useApiFetch()
  const { items: formulas, isLoading: formulasLoading } = useInfusionResource<FormulaRow>('formulas')

  const costosQuery = useQuery<{ data: { por_materia: CostoMateriaRow[]; por_formula: CostoFormulaRow[] } }>({
    queryKey: ['infusiones', 'costos'],
    queryFn: async () => {
      const res = await apiFetch('/api/infusiones/costos')
      if (!res.ok) throw new Error('Error al cargar costos')
      return res.json()
    },
  })

  if (formulasLoading || costosQuery.isLoading) return <ViewLoading variant="view" label="Infusiones" hideLabel />

  const porMateria = costosQuery.data?.data.por_materia ?? []
  const porFormula = costosQuery.data?.data.por_formula ?? []
  const sinPrecios = porFormula.some((f) => f.sin_precios)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Costo por sachet</CardTitle>
          <CardDescription>
            Calculado desde tus compras reales: precio de compra ÷ peso seco, aplicado a la receta.
            {sinPrecios && ' Alguna fórmula no tiene precios de compra aún (la recolección no tiene costo): se muestra «—».'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <CostosFormulaTable rows={porFormula} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planificador de recolección</CardTitle>
          <CardDescription>
            Con la receta y el rendimiento histórico fresca→seca: cuánto seco necesitas, cuánto tienes y cuánto fresco recolectar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Planificador formulas={formulas} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Costos por materia prima</CardTitle>
          <CardDescription>Costo del kg seco (solo lotes con precio de compra) y rendimiento promedio del proceso.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <CostosMateriaTable rows={porMateria} />
        </CardContent>
      </Card>
    </div>
  )
}
