'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ViewLoading, LoadingOverlay } from '@enjambre/ui'
import {
  ArrowUpRight, BarChart3, Calculator,
  Droplets, Hexagon, ShoppingBag, TreePine, Trophy, Truck, Users,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import Link from 'next/link'
import { ChartBox } from '@/components/charts/ChartBox'
import { HeaderEcosistema } from '@/components/apicultor/HeaderEcosistema'
import { BOSQUE_ULMO, ORO_MIEL, TEXT_MUTED, SALUD_OPTIMA, SALUD_RIESGO } from '@/lib/colors'
import { useApiFetch } from '@/hooks/use-api-fetch'
import { useWorkspaceLayout } from '@/hooks/use-workspace-layout'
import { ViewShell } from '@/components/layout/ViewShell'
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar'
import { useAuthStore } from '@enjambre/auth'
import { getDayTimePeriod, getGreetingByPeriod } from '@/lib/editorial-greeting'
import { cn } from '@/lib/cn'
import { DashboardEjecutivoSkeleton } from '@/components/shared/skeletons'

type TimeRange = 'month' | 'quarter' | 'ytd'

interface EjecutivoData {
  range: { key: TimeRange; label: string; from: string; to: string }
  kpis: {
    facturacion: number
    facturacionYTD: number
    ventas: number
    ticketPromedio: number
    clientesNuevos: number
    cosecha: number
    cosechaYTD: number
    margenUtilidad: number
    margenUtilidadYTD: number
    utilidadNeta: number
    utilidadNetaYTD: number
    co2Total: number
    arbolesYTD: number
    comisionesPendientes: number
    ivaPagar: number
    ppm: number
  }
  enjambre: {
    colmenas: { total: number; byHealth: { optima: number; atencion: number; riesgo: number } }
    apiarios: { total: number; byHealth: { optima: number; atencion: number; riesgo: number } }
    inspecciones: { totalYTD: number; latestVarroa: number | null }
    cosechas: { totalYTD: number; byMonth: { month: string; cosecha: number }[] }
    arboles: { totalYTD: number; co2Total: number; byMonth: number[] }
  }
  finanzas: {
    ingresosNetos: number
    gastos: number
    utilidadNeta: number
    ivaDebito: number
    ivaPagar: number
    ppm: number
    facturasPendientes: number
    cashFlow: { month: string; income: number; expenses: number }[]
    gastosByCategory: Record<string, number>
  }
  ventas: {
    totalVentasRange: number
    facturacionRange: number
    facturacionYTD: number
    newClientsRange: number
    byChannel: Record<string, number>
    channelCounts: Record<string, number>
    byMetodoPago: Record<string, { total: number; count: number }>
    trend: { month: string; total: number; count: number }[]
    recent: { total: number; channel: string | null; created_at: string | null }[]
  }
  equipo: {
    activeReps: number
    repTiers: { base: number; senior: number; elite: number; legend: number }
    topRep: { name: string; revenue: number } | null
    comisiones: { totalYTD: number; pendientes: number; avgTierMultiplier: number }
    caja: { openSessions: number; avgCashDifference: number; recentCount: number }
    leaderboard: {
      rep_id: string
      display_name: string
      total_commissions: number
      total_sales: number
      commission_tier: string
    }[]
  }
  stock: {
    lowStock: { id: string; nombre: string | null; stock: number | null; categoria: string | null }[]
    mielEnLotesKg: number
    lotesCriticos: number
    productosQuiebre: number
  }
  alerts: Array<{ severity: 'critical' | 'warning' | 'info'; title: string; detail: string }>
}

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtCLP(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

function formatRangeSubtitle(from: string, to: string): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${fmt(from)} → ${fmt(to)}`
}

// ─── constantes de chart ─────────────────────────────────────────────────────

const RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
  { key: 'month', label: 'Mes' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'ytd', label: 'YTD' },
]

const CHART_GRID = 'hsl(var(--border) / 0.5)'
const CHART_TOOLTIP: React.CSSProperties = {
  borderRadius: 8,
  border: 'none',
  boxShadow: 'var(--shadow-md)',
  fontFamily: 'Inter',
  fontSize: '0.82rem',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
}
const CHANNEL_COLORS: Record<string, string> = {
  feria: BOSQUE_ULMO,
  delivery: ORO_MIEL,
  local: 'hsl(var(--info))',
  corporativo: 'hsl(var(--chart-1))',
  web: 'hsl(var(--chart-5))',
  referido: SALUD_OPTIMA,
}

// ─── sub-componentes internos ────────────────────────────────────────────────

interface MicroKpiProps {
  label: string
  value: string | number
  tone?: 'default' | 'success' | 'warning' | 'destructive'
  className?: string
}

function MicroKpi({ label, value, tone = 'default', className }: MicroKpiProps) {
  const valueCls = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  }[tone]
  return (
    <div className={cn('flex flex-col gap-0.5 rounded-xl bg-surface-raised px-3 py-3', className)}>
      <span className={cn('text-lg font-black tabular-nums leading-none', valueCls)}>{value}</span>
      <span className="text-[10px] leading-tight text-muted-foreground">{label}</span>
    </div>
  )
}

interface SectionCardProps {
  icon: ReactNode
  title: string
  href: string
  linkLabel?: string
  children: ReactNode
  delay?: number
}

function SectionCard({ icon, title, href, linkLabel = 'Ver módulo', children, delay = 0 }: SectionCardProps) {
  return (
    <section
      className="animate-in space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {icon} {title}
        </span>
        <Link
          href={href}
          className="inline-flex min-h-9 items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {linkLabel} <ArrowUpRight size={11} />
        </Link>
      </div>
      {children}
    </section>
  )
}

// ─── componente principal ────────────────────────────────────────────────────

export function DashboardEjecutivo() {
  const [range, setRange] = useState<TimeRange>('ytd')
  const apiFetch = useApiFetch()
  const fullName = useAuthStore((s) => s.user?.full_name)
  const { contentMode } = useWorkspaceLayout()

  const { data, isLoading, isFetching, error } = useQuery<EjecutivoData>({
    queryKey: ['dashboard-ejecutivo', range],
    queryFn: async () => {
      const res = await apiFetch(`/api/dashboard/ejecutivo?range=${range}`)
      if (!res.ok) throw new Error('Failed to fetch ejecutivo')
      return res.json() as Promise<EjecutivoData>
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  if (isLoading && !data) return <DashboardEjecutivoSkeleton />

  if ((error || !data) && !data) {
    return (
      <div className="animate-in p-8">
        <div className="card border-destructive/30">
          <div className="mb-2 font-semibold text-destructive">Error al cargar datos</div>
          <div className="text-[0.85rem] text-muted-foreground">{error?.message ?? 'Sin datos disponibles'}</div>
        </div>
      </div>
    )
  }

  const { kpis, enjambre, finanzas, ventas, equipo, stock } = data
  const rangeLabel = data.range.label
  const rangeSubtitle = formatRangeSubtitle(data.range.from, data.range.to)

  const greeting = getGreetingByPeriod(getDayTimePeriod(new Date().getHours()), fullName ?? 'Comandante')

  const isWide = contentMode !== 'narrow'
  const gridCols = contentMode === 'narrow' ? 'grid-cols-2' : contentMode === 'medium' ? 'grid-cols-3' : 'grid-cols-4'

  // datasets para gráficas
  const healthData = [
    { name: 'Óptima', value: enjambre.colmenas.byHealth.optima, color: SALUD_OPTIMA },
    { name: 'Atención', value: enjambre.colmenas.byHealth.atencion, color: ORO_MIEL },
    { name: 'Riesgo', value: enjambre.colmenas.byHealth.riesgo, color: SALUD_RIESGO },
  ].filter((d) => d.value > 0)

  const channelData = Object.entries(ventas.byChannel)
    .sort(([, a], [, b]) => b - a)
    .map(([channel, revenue]) => ({ channel, revenue }))

  const gastosCategoryData = Object.entries(finanzas.gastosByCategory)
    .map(([cat, monto]) => ({ category: cat, monto }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 6)

  const metodoPagoData = Object.entries(ventas.byMetodoPago).map(([mp, val]) => ({
    metodo: mp,
    total: val.total,
    count: val.count,
  }))

  const emptyChart = (h: number) => (
    <div
      className="flex items-center justify-center text-[0.85rem] text-muted-foreground"
      style={{ height: h }}
    >
      Sin datos en el período
    </div>
  )

  return (
    <div className="relative animate-in space-y-4">
      {isFetching && data ? <LoadingOverlay /> : null}

      <ViewShell
        variant="compact"
        eyebrow="Visión"
        greeting={greeting}
        title="Inicio"
        subtitle={rangeSubtitle}
        icon={<BarChart3 size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="inicio-range"
        tabs={RANGE_OPTIONS.map((opt) => ({ id: opt.key, label: opt.label }))}
        activeId={range}
        onChange={(id) => setRange(id as TimeRange)}
      />

      {/* ── APÍCOLA ──────────────────────────────────────────────────── */}
      <SectionCard icon={<Hexagon size={13} />} title="Apícola" href="/colmenas" delay={40}>
        <div className={cn('grid gap-2', gridCols)}>
          <MicroKpi label="Colmenas" value={enjambre.colmenas.total} />
          <MicroKpi label="Apiarios" value={enjambre.apiarios.total} />
          <MicroKpi label="Inspecciones YTD" value={enjambre.inspecciones.totalYTD} />
          <MicroKpi
            label="Varroa última"
            value={enjambre.inspecciones.latestVarroa != null ? `${enjambre.inspecciones.latestVarroa}%` : '—'}
            tone={
              enjambre.inspecciones.latestVarroa != null
                ? enjambre.inspecciones.latestVarroa > 3 ? 'destructive' : 'success'
                : 'default'
            }
          />
        </div>

        {/* Distribución de salud: pie + leyenda */}
        {healthData.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-2">
            <ChartBox height={90} width={90} className="w-[90px] shrink-0">
              <PieChart>
                <Pie data={healthData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={22} outerRadius={42} paddingAngle={2}>
                  {healthData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartBox>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Salud de colmenas
              </span>
              {healthData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-[0.82rem]">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-semibold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Varroa inline si no hay hoja previa */}
        {enjambre.inspecciones.latestVarroa != null && (
          <div className="flex items-center justify-between rounded-lg bg-surface-raised px-4 py-2 text-[0.78rem] text-muted-foreground">
            <span>Varroa última muestra</span>
            <span
              className="font-semibold"
              style={{
                color: enjambre.inspecciones.latestVarroa > 3
                  ? 'hsl(var(--destructive))'
                  : 'hsl(var(--success))',
              }}
            >
              {enjambre.inspecciones.latestVarroa}%
              {enjambre.inspecciones.latestVarroa > 3 ? ' — crítico' : ''}
            </span>
          </div>
        )}
        {/* Pulso ambiental: luna · región · floración activa */}
        <div className="-mx-4 -mb-4 sm:-mx-5 sm:-mb-5 overflow-hidden rounded-b-2xl">
          <HeaderEcosistema />
        </div>
      </SectionCard>

      {/* ── BOSQUE ──────────────────────────────────────────────────── */}
      <SectionCard icon={<TreePine size={13} />} title="Bosque" href="/regeneracion" delay={70}>
        <div className="grid grid-cols-2 gap-2">
          <MicroKpi label="Árboles YTD" value={fmtNum(enjambre.arboles.totalYTD)} tone="success" />
          <MicroKpi label="ton CO₂" value={fmtNum(enjambre.arboles.co2Total)} tone="success" />
        </div>

        {enjambre.arboles.byMonth.some((v) => v > 0) && (
          <ChartBox height={120} className="chart-shell">
            <BarChart data={enjambre.arboles.byMonth.map((v, i) => ({ mes: i + 1, arboles: v }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke={TEXT_MUTED} />
              <YAxis tick={{ fontSize: 10 }} stroke={TEXT_MUTED} />
              <Tooltip contentStyle={CHART_TOOLTIP} />
              <Bar dataKey="arboles" fill={SALUD_OPTIMA} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartBox>
        )}
      </SectionCard>

      {/* ── PRODUCCIÓN ──────────────────────────────────────────────── */}
      <SectionCard icon={<Droplets size={13} />} title="Producción" href="/produccion" delay={100}>
        <div className={cn('grid gap-2', gridCols)}>
          <MicroKpi label={`Kg recolectados · ${rangeLabel}`} value={`${fmtNum(kpis.cosecha)} kg`} />
          <MicroKpi label="Miel en lotes" value={`${stock.mielEnLotesKg.toFixed(1)} kg`} />
          <MicroKpi label="Lotes críticos" value={stock.lotesCriticos} tone={stock.lotesCriticos > 0 ? 'warning' : 'default'} />
          <MicroKpi label="Quiebre de stock" value={stock.productosQuiebre} tone={stock.productosQuiebre > 0 ? 'destructive' : 'default'} />
        </div>

        {/* Recolección por mes */}
        {enjambre.cosechas.byMonth.some((m) => m.cosecha > 0) && (
          <ChartBox height={160} className="chart-shell">
            <BarChart data={enjambre.cosechas.byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke={TEXT_MUTED} />
              <YAxis tick={{ fontSize: 10 }} stroke={TEXT_MUTED} tickFormatter={(v: number) => `${v}kg`} />
              <Tooltip
                contentStyle={CHART_TOOLTIP}
                formatter={(v) => [`${String(v ?? 0)} kg`, 'Recolección']}
              />
              <Bar dataKey="cosecha" name="Recolección" fill={BOSQUE_ULMO} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartBox>
        )}

        {/* Stock bajo */}
        {stock.lowStock.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Stock bajo</span>
            {stock.lowStock.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-[11px]">
                <span className="max-w-[70%] truncate text-foreground">{p.nombre ?? 'Sin nombre'}</span>
                <span className="font-semibold text-warning">{p.stock} uds</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── DESPACHO ────────────────────────────────────────────────── */}
      <SectionCard icon={<Truck size={13} />} title="Despacho" href="/despacho/envios" linkLabel="Ver envíos" delay={130}>
        <p className="text-[11px] text-muted-foreground">
          Envíos, centros de stock y logística de salida.
        </p>
      </SectionCard>

      {/* ── MERCADO ─────────────────────────────────────────────────── */}
      <SectionCard icon={<ShoppingBag size={13} />} title="Mercado" href="/pipeline" delay={160}>
        <div className={cn('grid gap-2', gridCols)}>
          <MicroKpi label={`Facturación · ${rangeLabel}`} value={fmtCLP(kpis.facturacion)} />
          <MicroKpi label="Ventas" value={kpis.ventas} />
          <MicroKpi label="Ticket promedio" value={fmtCLP(kpis.ticketPromedio)} />
          <MicroKpi label="Clientes nuevos" value={kpis.clientesNuevos} />
        </div>

        {/* Gráficas: tendencia + canales — 2 col en desktop */}
        <div className={cn('grid gap-4', isWide ? 'grid-cols-2' : 'grid-cols-1')}>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Tendencia de ventas
            </div>
            {ventas.trend.length > 0 ? (
              <ChartBox height={180} className="chart-shell">
                <AreaChart data={ventas.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke={TEXT_MUTED} />
                  <YAxis tick={{ fontSize: 10 }} stroke={TEXT_MUTED} tickFormatter={(v: number) => fmtCLP(v)} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP}
                    formatter={(v: unknown) => [fmtCLP(Number(v ?? 0)), 'Ventas']}
                  />
                  <Area type="monotone" dataKey="total" name="Ventas" stroke={BOSQUE_ULMO} fill="hsl(var(--primary) / 0.12)" strokeWidth={2} />
                </AreaChart>
              </ChartBox>
            ) : emptyChart(180)}
          </div>

          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Ingresos por canal
            </div>
            {channelData.length > 0 ? (
              <ChartBox height={180} className="chart-shell">
                <BarChart data={channelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke={TEXT_MUTED} />
                  <YAxis dataKey="channel" type="category" tick={{ fontSize: 10 }} stroke={TEXT_MUTED} width={80} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP}
                    formatter={(v: unknown) => [fmtCLP(Number(v ?? 0)), 'Ingresos']}
                  />
                  <Bar dataKey="revenue" name="Ingresos" radius={[0, 3, 3, 0]}>
                    {channelData.map((entry, idx) => (
                      <Cell key={idx} fill={CHANNEL_COLORS[entry.channel] ?? ORO_MIEL} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartBox>
            ) : emptyChart(180)}
          </div>
        </div>

        {/* Ventas recientes */}
        {ventas.recent.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Ventas recientes</span>
            {ventas.recent.slice(0, 3).map((v, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="capitalize text-muted-foreground">{v.channel ?? 'web'}</span>
                <span className="font-semibold text-foreground">{fmtCLP(v.total)}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── EQUIPO ──────────────────────────────────────────────────── */}
      <SectionCard icon={<Users size={13} />} title="Equipo" href="/crm" delay={190}>
        <div className={cn('grid gap-2', gridCols)}>
          <MicroKpi label="Reps activos" value={equipo.activeReps} />
          <MicroKpi
            label="Comisiones pendientes"
            value={fmtCLP(equipo.comisiones.pendientes)}
            tone={equipo.comisiones.pendientes > 0 ? 'warning' : 'default'}
          />
          <MicroKpi label="Tier promedio" value={`×${equipo.comisiones.avgTierMultiplier}`} />
        </div>

        {/* Métodos de pago + leaderboard — 2 col en desktop */}
        <div className={cn('grid gap-4', isWide ? 'grid-cols-2' : 'grid-cols-1')}>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Métodos de pago
            </div>
            {metodoPagoData.length > 0 ? (
              <ChartBox height={160} className="chart-shell">
                <BarChart data={metodoPagoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="metodo" tick={{ fontSize: 10 }} stroke={TEXT_MUTED} />
                  <YAxis tick={{ fontSize: 10 }} stroke={TEXT_MUTED} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP}
                    formatter={(v) => [String(v ?? 0), 'Transacciones']}
                  />
                  <Bar dataKey="count" name="Transacciones" fill={ORO_MIEL} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartBox>
            ) : emptyChart(160)}
          </div>

          <div className="space-y-3">
            {equipo.topRep && (
              <div className="flex items-center gap-2 text-[11px]">
                <Trophy size={12} className="shrink-0 text-warning" />
                <span className="font-semibold text-foreground">{equipo.topRep.name}</span>
                <span className="text-muted-foreground">— {fmtCLP(equipo.topRep.revenue)} lifetime</span>
              </div>
            )}
            {equipo.leaderboard.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Top 3</span>
                {equipo.leaderboard.slice(0, 3).map((entry, i) => (
                  <div key={entry.rep_id} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-muted-foreground">{i + 1}.</span>
                      <span className="text-foreground">{entry.display_name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{fmtCLP(entry.total_commissions)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── FINANZAS ────────────────────────────────────────────────── */}
      <SectionCard icon={<Calculator size={13} />} title="Finanzas" href="/contable" delay={220}>
        <div className={cn('grid gap-2', gridCols)}>
          <MicroKpi label="Ingresos netos" value={fmtCLP(finanzas.ingresosNetos)} tone="success" />
          <MicroKpi label="Gastos" value={fmtCLP(finanzas.gastos)} tone="destructive" />
          <MicroKpi
            label="Utilidad neta"
            value={fmtCLP(finanzas.utilidadNeta)}
            tone={finanzas.utilidadNeta >= 0 ? 'success' : 'destructive'}
          />
          <MicroKpi label="IVA por pagar" value={fmtCLP(finanzas.ivaPagar)} />
          <MicroKpi label="PPM" value={fmtCLP(finanzas.ppm)} />
          <MicroKpi label={`Margen · ${rangeLabel}`} value={`${kpis.margenUtilidad}%`} />
        </div>

        {/* Cashflow + gastos por categoría — 2 col en desktop */}
        <div className={cn('grid gap-4', isWide ? 'grid-cols-2' : 'grid-cols-1')}>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Flujo de caja YTD
            </div>
            {finanzas.cashFlow.some((cf) => cf.income > 0 || cf.expenses > 0) ? (
              <ChartBox height={180} className="chart-shell">
                <AreaChart data={finanzas.cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke={TEXT_MUTED} />
                  <YAxis tick={{ fontSize: 10 }} stroke={TEXT_MUTED} tickFormatter={(v: number) => fmtCLP(v)} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP}
                    formatter={(v: unknown, name: unknown) => [
                      fmtCLP(Number(v ?? 0)),
                      name === 'income' ? 'Ingresos' : name === 'expenses' ? 'Gastos' : String(name),
                    ]}
                  />
                  <Area type="monotone" dataKey="income" name="Ingresos" stroke={SALUD_OPTIMA} fill="hsl(var(--success) / 0.10)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Gastos" stroke={SALUD_RIESGO} fill="hsl(var(--destructive) / 0.07)" strokeWidth={2} />
                </AreaChart>
              </ChartBox>
            ) : emptyChart(180)}
          </div>

          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Gastos por categoría
            </div>
            {gastosCategoryData.length > 0 ? (
              <ChartBox height={180} className="chart-shell">
                <BarChart data={gastosCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke={TEXT_MUTED} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} stroke={TEXT_MUTED} width={90} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP}
                    formatter={(v: unknown) => [fmtCLP(Number(v ?? 0)), 'Monto']}
                  />
                  <Bar dataKey="monto" name="Monto" fill={SALUD_RIESGO} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ChartBox>
            ) : emptyChart(180)}
          </div>
        </div>

        {finanzas.facturasPendientes > 0 && (
          <p className="text-[11px] text-warning">
            {finanzas.facturasPendientes} factura{finanzas.facturasPendientes > 1 ? 's' : ''} pendiente{finanzas.facturasPendientes > 1 ? 's' : ''} de aprobación —{' '}
            <Link href="/sii" className="underline underline-offset-2 hover:text-foreground">Ver SII</Link>
          </p>
        )}
      </SectionCard>
    </div>
  )
}
