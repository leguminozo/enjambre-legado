'use client'

import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ViewLoading, LoadingOverlay } from '@enjambre/ui'
import {
  BarChart3, TrendingUp, DollarSign, Target, Leaf, Crown,
  ArrowUpRight, Hexagon, TreePine, Users, Wallet, Percent,
  Trophy, AlertTriangle, AlertCircle, Info, Clock, ShoppingCart,
  CreditCard, PackageX,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { ChartBox } from '@/components/charts/ChartBox'
import { BOSQUE_ULMO, ORO_MIEL, TEXT_MUTED, SALUD_OPTIMA, SALUD_RIESGO } from '@/lib/colors'
import { useApiFetch } from '@/hooks/use-api-fetch'
import { KpiCard } from '@/components/ui/KpiCard'
import { ViewShell } from '@/components/layout/ViewShell'
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar'

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
    leaderboard: { rep_id: string; display_name: string; total_commissions: number; total_sales: number; commission_tier: string }[]
  }
  stock: {
    lowStock: { id: string; nombre: string | null; stock: number | null; categoria: string | null }[]
  }
  alerts: Array<{ severity: 'critical' | 'warning' | 'info'; title: string; detail: string }>
}

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
    new Date(`${iso}T12:00:00`).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  return `${fmt(from)} → ${fmt(to)}`
}

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

const TIER_COLORS: Record<string, string> = {
  base: TEXT_MUTED,
  senior: ORO_MIEL,
  elite: BOSQUE_ULMO,
  legend: 'hsl(var(--primary))',
}

const ALERT_ICONS = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
}
const ALERT_COLORS = {
  critical: 'hsl(var(--destructive))',
  warning: 'hsl(var(--warning))',
  info: 'hsl(var(--info))',
}
const ALERT_BG = {
  critical: 'hsl(var(--destructive) / 0.08)',
  warning: 'hsl(var(--warning) / 0.08)',
  info: 'hsl(var(--info) / 0.06)',
}

const RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
  { key: 'month', label: 'Mes' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'ytd', label: 'YTD' },
]

export function DashboardEjecutivo() {
  const [range, setRange] = useState<TimeRange>('ytd')
  const apiFetch = useApiFetch()

  const { data, isLoading, isFetching, error } = useQuery<EjecutivoData>({
    queryKey: ['dashboard-ejecutivo', range],
    queryFn: async () => {
      const res = await apiFetch(`/api/dashboard/ejecutivo?range=${range}`)
      if (!res.ok) throw new Error('Failed to fetch ejecutivo')
      return res.json()
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  if (isLoading && !data) {
    return <ViewLoading variant="view" label="Panel ejecutivo" hideLabel />
  }

  if ((error || !data) && !data) {
    return (
      <div className="animate-in p-8">
        <div className="card border-destructive/30">
          <div className="text-destructive font-semibold mb-2">Error al cargar datos</div>
          <div className="text-muted-foreground text-[0.85rem]">{error?.message ?? 'Sin datos disponibles'}</div>
        </div>
      </div>
    )
  }

  const { kpis, enjambre, finanzas, ventas, equipo, stock, alerts } = data
  const rangeLabel = data.range.label
  const rangeSubtitle = formatRangeSubtitle(data.range.from, data.range.to)

  const channelData = Object.entries(ventas.byChannel).map(([channel, revenue]) => ({
    channel,
    revenue,
  }))

  const healthData = [
    { name: 'Óptima', value: enjambre.colmenas.byHealth.optima, color: SALUD_OPTIMA },
    { name: 'Atención', value: enjambre.colmenas.byHealth.atencion, color: ORO_MIEL },
    { name: 'Riesgo', value: enjambre.colmenas.byHealth.riesgo, color: SALUD_RIESGO },
  ].filter(d => d.value > 0)

  const gastosCategoryData = Object.entries(finanzas.gastosByCategory)
    .map(([cat, monto]) => ({ category: cat, monto }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 6)

  const metodoPagoData = Object.entries(ventas.byMetodoPago).map(([mp, val]) => ({
    metodo: mp,
    total: val.total,
    count: val.count,
  }))

  return (
    <div className="space-y-6 animate-in relative">
      {isFetching && data ? <LoadingOverlay /> : null}
      <ViewShell
        variant="compact"
        eyebrow="Gerencia"
        title="Panel Ejecutivo"
        subtitle={rangeSubtitle}
        icon={<BarChart3 size={20} />}
        actions={
          <span className="text-[0.78rem] text-muted-foreground flex items-center gap-1.5">
            <Clock size={14} />
            Actualizado
          </span>
        }
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="ejecutivo-range"
        tabs={RANGE_OPTIONS.map((opt) => ({ id: opt.key, label: opt.label }))}
        activeId={range}
        onChange={(id) => setRange(id as TimeRange)}
      />

      {alerts.length > 0 && (
        <div className="flex flex-col gap-2 mb-6">
          {alerts.map((alert, i) => {
            const IconComp = ALERT_ICONS[alert.severity]
            return (
              <div
                key={i}
                className="p-4 rounded-xl flex gap-3 animate-in border border-border/30 glass shadow-glass"
                style={{
                  borderLeft: `4px solid ${ALERT_COLORS[alert.severity]}`,
                  animationDelay: `${i * 50}ms`,
                }}>
                <IconComp size={18} className="shrink-0" style={{ color: ALERT_COLORS[alert.severity] }} />
                <div className="flex-1">
                  <div className="text-[0.85rem] font-semibold text-foreground">{alert.title}</div>
                  <div className="text-[0.78rem] text-muted-foreground mt-0.5">{alert.detail}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <KpiCard
          title={`Facturaciones YTD`}
          value={fmtCLP(kpis.facturacion)}
          icon={<DollarSign size={20} />}
          description={`Acumulado YTD: ${fmtCLP(kpis.facturacionYTD)}.`}
          sparkline={ventas.trend.map(t => t.total)}
        />
        <KpiCard
          title="Ventas"
          value={kpis.ventas}
          icon={<ShoppingCart size={20} />}
          description={`Ticket promedio: ${fmtCLP(kpis.ticketPromedio)}.`}
          sparkline={ventas.trend.map(t => t.count)}
        />
        <KpiCard
          title={`Cosecha ${rangeLabel}`}
          value={`${fmtNum(kpis.cosecha)} kg`}
          icon={<Target size={20} />}
          description={`YTD: ${fmtNum(kpis.cosechaYTD)} kg.`}
          sparkline={enjambre.cosechas.byMonth.map(m => m.cosecha)}
        />
        <KpiCard
          title="Margen Utilidad"
          value={`${kpis.margenUtilidad}%`}
          icon={<TrendingUp size={20} />}
          description={`Promedio YTD: ${kpis.margenUtilidadYTD}%.`}
        />
        <KpiCard
          title="Clientes Nuevos"
          value={kpis.clientesNuevos}
          icon={<Users size={20} />}
          description={`${enjambre.colmenas.total} colmenas.`}
        />
        <KpiCard
          title="CO₂ Secuestrado"
          value={`${fmtNum(kpis.co2Total)} ton`}
          icon={<Leaf size={20} />}
          description={`${kpis.arbolesYTD} árboles nativos YTD.`}
          sparkline={enjambre.arboles.byMonth}
        />
      </div>

      <div className="dashboard-grid dashboard-grid-2 mt-6">
        <div className="card animate-in delay-2">
          <div className="section-header">
            <div>
              <div className="section-title">Tendencia de Ventas</div>
              <div className="section-subtitle">{rangeLabel} · CLP por mes</div>
            </div>
          </div>
          {ventas.trend.length > 0 ? (
            <ChartBox height={260} className="chart-shell">
              <AreaChart data={ventas.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={TEXT_MUTED} />
                <YAxis tick={{ fontSize: 12 }} stroke={TEXT_MUTED} />
                <Tooltip contentStyle={CHART_TOOLTIP} />
                <Area type="monotone" dataKey="total" stroke={BOSQUE_ULMO} fill={`hsl(var(--primary) / 0.15)`} strokeWidth={2} />
              </AreaChart>
            </ChartBox>
          ) : (
            <div className="chart-shell flex items-center justify-center h-[260px] text-muted-foreground text-[0.85rem]">
              Sin ventas en el período
            </div>
          )}
        </div>

        <div className="card animate-in delay-3">
          <div className="section-header">
            <div>
              <div className="section-title">Ingresos por Canal</div>
              <div className="section-subtitle">{rangeLabel} · {ventas.totalVentasRange} ventas</div>
            </div>
          </div>
          {channelData.length > 0 ? (
            <ChartBox height={260} className="chart-shell">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
                <YAxis dataKey="channel" type="category" tick={{ fontSize: 12 }} stroke={TEXT_MUTED} width={80} />
                <Tooltip contentStyle={CHART_TOOLTIP} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {channelData.map((entry, idx) => (
                    <Cell key={idx} fill={CHANNEL_COLORS[entry.channel] ?? ORO_MIEL} />
                  ))}
                </Bar>
              </BarChart>
            </ChartBox>
          ) : (
            <div className="chart-shell flex items-center justify-center h-[260px] text-muted-foreground text-[0.85rem]">
              Sin ventas registradas
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-2-1 mt-6">
        <div className="card animate-in delay-3">
          <div className="section-header">
            <div>
              <div className="section-title">Flujo de Caja</div>
              <div className="section-subtitle">Ingresos vs Egresos YTD (CLP)</div>
            </div>
          </div>
          <ChartBox height={240} className="chart-shell">
            <AreaChart data={finanzas.cashFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={TEXT_MUTED} />
              <YAxis tick={{ fontSize: 12 }} stroke={TEXT_MUTED} />
              <Tooltip contentStyle={CHART_TOOLTIP} />
              <Area type="monotone" dataKey="income" stroke={SALUD_OPTIMA} fill={`hsl(var(--success) / 0.12)`} strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke={SALUD_RIESGO} fill={`hsl(var(--destructive) / 0.08)`} strokeWidth={2} />
            </AreaChart>
          </ChartBox>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card animate-in delay-4 flex-1">
            <div className="section-title text-base mb-4 flex items-center gap-2">
              <Hexagon size={18} className="text-accent" /> Estado Colmenas
            </div>
            {healthData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ChartBox height={100} className="w-[100px]">
                  <PieChart>
                    <Pie data={healthData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={2}>
                      {healthData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartBox>
                <div className="flex flex-col gap-1.5">
                  {healthData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-[0.82rem]">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="text-foreground font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-[0.85rem]">Sin colmenas registradas</div>
            )}
            {enjambre.inspecciones.latestVarroa != null && (
              <div className="mt-4 px-4 py-2 rounded-sm bg-muted/50 text-[0.78rem] text-muted-foreground">
                Varroa última: <span className="font-semibold" style={{ color: enjambre.inspecciones.latestVarroa > 3 ? 'hsl(var(--destructive))' : 'hsl(var(--success))' }}>{enjambre.inspecciones.latestVarroa}%</span>
              </div>
            )}
          </div>

          <div className="card animate-in delay-5 flex-1">
            <div className="section-title text-base mb-4 flex items-center gap-2">
              <TreePine size={18} className="text-success" /> Bosque
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-4 rounded-sm bg-success/[0.08] text-center">
                <div className="text-[1.3rem] font-bold text-success">{enjambre.arboles.totalYTD}</div>
                <div className="text-[0.72rem] text-muted-foreground">Árboles YTD</div>
              </div>
              <div className="p-4 rounded-sm bg-accent/10 text-center">
                <div className="text-[1.3rem] font-bold text-accent">{fmtNum(enjambre.arboles.co2Total)}</div>
                <div className="text-[0.72rem] text-muted-foreground">ton CO₂</div>
              </div>
            </div>
            <div className="mt-2 text-[0.75rem] text-muted-foreground">
              {enjambre.apiarios.total} apiarios · {enjambre.inspecciones.totalYTD} inspecciones YTD
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-2 mt-6">
        <div className="card animate-in delay-4">
          <div className="section-header">
            <div>
              <div className="section-title">Finanzas</div>
              <div className="section-subtitle">Resumen {rangeLabel}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-sm bg-success/[0.08]">
              <div className="text-[0.72rem] text-muted-foreground mb-1">Ingresos netos</div>
              <div className="text-xl font-bold text-success">{fmtCLP(finanzas.ingresosNetos)}</div>
            </div>
            <div className="p-4 rounded-sm bg-destructive/[0.08]">
              <div className="text-[0.72rem] text-muted-foreground mb-1">Gastos</div>
              <div className="text-xl font-bold text-destructive">{fmtCLP(finanzas.gastos)}</div>
            </div>
            <div className="p-4 rounded-sm bg-accent/10">
              <div className="text-[0.72rem] text-muted-foreground mb-1">Utilidad neta</div>
              <div className="text-xl font-bold" style={{ color: finanzas.utilidadNeta >= 0 ? 'hsl(var(--accent))' : 'hsl(var(--destructive))' }}>{fmtCLP(finanzas.utilidadNeta)}</div>
            </div>
            <div className="p-4 rounded-sm bg-muted/50">
              <div className="text-[0.72rem] text-muted-foreground mb-1">IVA por pagar</div>
              <div className="text-xl font-bold text-foreground">{fmtCLP(finanzas.ivaPagar)}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-[0.78rem] text-muted-foreground">
            <span>PPM: {fmtCLP(finanzas.ppm)}</span>
            {finanzas.facturasPendientes > 0 && (
              <>
                <span>·</span>
                <span className="badge badge-warning">{finanzas.facturasPendientes} facturas pendientes</span>
              </>
            )}
          </div>
        </div>

        <div className="card animate-in delay-5">
          <div className="section-header">
            <div>
              <div className="section-title">Gastos por Categoría</div>
              <div className="section-subtitle">{rangeLabel} · Top 6</div>
            </div>
          </div>
          {gastosCategoryData.length > 0 ? (
            <ChartBox height={260} className="chart-shell">
              <BarChart data={gastosCategoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} stroke={TEXT_MUTED} width={90} />
                <Tooltip contentStyle={CHART_TOOLTIP} />
                <Bar dataKey="monto" fill={SALUD_RIESGO} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartBox>
          ) : (
            <div className="chart-shell flex items-center justify-center h-[260px] text-muted-foreground text-[0.85rem]">
              Sin gastos en el período
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-2 mt-6">
        <div className="card animate-in delay-4">
          <div className="section-header">
            <div>
              <div className="section-title">Equipo</div>
              <div className="section-subtitle">{equipo.activeReps} reps activos · Comisiones: {fmtCLP(equipo.comisiones.totalYTD)} {rangeLabel}</div>
            </div>
          </div>

          {equipo.topRep && (
            <div className="p-4 rounded-sm bg-accent/[0.08] mb-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
                <Trophy size={18} className="text-accent" />
              </div>
              <div>
                <div className="text-[0.9rem] font-semibold text-foreground">{equipo.topRep.name}</div>
                <div className="text-[0.75rem] text-muted-foreground">Top rep · {fmtCLP(equipo.topRep.revenue)} lifetime</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1 mb-4">
            {Object.entries(equipo.repTiers).map(([tier, count]) => (
              <div key={tier} className="text-center p-2 rounded-sm bg-muted/30">
                <div className="text-[1.1rem] font-bold" style={{ color: TIER_COLORS[tier] ?? 'hsl(var(--foreground))' }}>{count}</div>
                <div className="text-[0.65rem] text-muted-foreground capitalize">{tier}</div>
              </div>
            ))}
          </div>

          {equipo.comisiones.pendientes > 0 && (
            <div className="px-4 py-2 rounded-sm bg-warning/[0.08] text-[0.78rem] mb-4">
              <span className="text-warning font-semibold">{fmtCLP(equipo.comisiones.pendientes)}</span>
              <span className="text-muted-foreground"> comisiones pendientes</span>
            </div>
          )}

          <div className="flex gap-6 text-[0.78rem] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Wallet size={14} />
              <span>{equipo.caja.openSessions} sesiones abiertas</span>
            </div>
            <div className="flex items-center gap-1">
              <Percent size={14} />
              <span>Tier ×{equipo.comisiones.avgTierMultiplier}</span>
            </div>
          </div>

          {equipo.leaderboard.length > 0 && (
            <div className="mt-4">
              <div className="text-[0.72rem] font-semibold text-muted-foreground mb-2 uppercase tracking-[0.05em]">Leaderboard semanal</div>
              {equipo.leaderboard.slice(0, 3).map((entry, i) => (
                <div key={entry.rep_id} className={`flex items-center justify-between py-1.5 ${i < 2 ? 'border-b border-border/30' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[0.75rem] font-bold w-5 ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}.</span>
                    <span className="text-[0.82rem] text-foreground">{entry.display_name}</span>
                    <span className="badge badge-gold text-[0.65rem]">{entry.commission_tier}</span>
                  </div>
                  <span className="text-[0.82rem] font-semibold text-accent">{fmtCLP(entry.total_commissions)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card animate-in delay-5">
          <div className="section-header">
            <div>
              <div className="section-title">Métodos de Pago</div>
              <div className="section-subtitle">{rangeLabel} · Distribución por método</div>
            </div>
          </div>
          {metodoPagoData.length > 0 ? (
            <ChartBox height={200} className="chart-shell">
              <BarChart data={metodoPagoData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="metodo" tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
                <YAxis tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
                <Tooltip contentStyle={CHART_TOOLTIP} />
                <Bar dataKey="count" fill={ORO_MIEL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartBox>
          ) : (
            <div className="chart-shell flex items-center justify-center h-[200px] text-muted-foreground text-[0.85rem]">
              Sin datos de método de pago
            </div>
          )}

          {stock.lowStock.length > 0 && (
            <div className="mt-6">
              <div className="section-title text-base mb-2 flex items-center gap-2">
                <PackageX size={18} className="text-warning" /> Stock Bajo
              </div>
              {stock.lowStock.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border/30">
                  <span className="text-[0.82rem] text-foreground">{p.nombre ?? 'Sin nombre'}</span>
                  <span className="badge badge-warning text-[0.7rem]">{p.stock} uds</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {ventas.recent.length > 0 && (
        <div className="card animate-in delay-5 mt-6">
          <div className="section-header">
            <div>
              <div className="section-title">Ventas Recientes</div>
              <div className="section-subtitle">Últimas 5 transacciones</div>
            </div>
          </div>
          <div className="grid gap-0">
            {ventas.recent.map((v, i) => (
              <div key={i} className={`flex items-center justify-between py-2 ${i < ventas.recent.length - 1 ? 'border-b border-border/30' : ''}`}>
                <div className="flex items-center gap-4">
                  <CreditCard size={14} style={{ color: TEXT_MUTED }} />
                  <span className="text-[0.82rem] text-foreground">{v.channel ?? 'web'}</span>
                  <span className="text-[0.72rem]" style={{ color: TEXT_MUTED }}>
                    {v.created_at ? new Date(v.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : ''}
                  </span>
                </div>
                <span className="text-[0.85rem] font-semibold text-accent">{fmtCLP(v.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
