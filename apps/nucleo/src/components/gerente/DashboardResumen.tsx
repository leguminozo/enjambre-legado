'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ViewLoading, LoadingOverlay } from '@enjambre/ui'
import { BarChart3, TrendingUp, DollarSign, Target, Leaf, Crown, ArrowUpRight, Hexagon, TreePine, Users, Wallet, Percent, Trophy } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { BOSQUE_ULMO, ORO_MIEL, TEXT_MUTED, SALUD_OPTIMA, SALUD_RIESGO } from '@/lib/colors'
import { useApiFetch } from '@/hooks/use-api-fetch'
import { KpiCard } from '@/components/ui/KpiCard'

const CHART_GRID = 'hsl(var(--border) / 0.5)'

interface ResumenData {
  enjambre: {
    colmenas: { total: number; byHealth: { optima: number; atencion: number; riesgo: number }; productionTotal: number }
    apiarios: { total: number }
    inspecciones: { totalYTD: number; latestVarroa: number | null }
    cosechas: { totalYTD: number; byMonth: { month: string; cosecha: number }[] }
    arboles: { totalYTD: number; co2Total: number; byMonth: number[] }
  }
  finanzas: {
    facturacionYTD: number
    facturacionMes: number
    ingresosNetosYTD: number
    gastosYTD: number
    utilidadNetaYTD: number
    margenUtilidad: number
    ivaDebitoYTD: number
    ivaPagar: number
    ppm: number
    facturasPendientes: number
    totalFacturasEmitidas: number
    cashFlow: { month: string; income: number; expenses: number }[]
  }
  ventas: {
    totalVentasYTD: number
    facturacionYTD: number
    newClientsYTD: number
    byChannel: Record<string, number>
    revenueByProductType: Record<string, { revenue: number; count: number }>
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

export function DashboardResumen() {
  const apiFetch = useApiFetch()

  const { data, isLoading, isFetching, error } = useQuery<ResumenData>({
    queryKey: ['dashboard-resumen'],
    queryFn: async () => {
      const res = await apiFetch('/api/dashboard/resumen')
      if (!res.ok) throw new Error('Failed to fetch resumen')
      return res.json()
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  if (isLoading && !data) {
    return <ViewLoading variant="view" label="Resumen del enjambre" hideLabel />
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

  const { enjambre, finanzas, ventas, equipo } = data

  const channelData = Object.entries(ventas.byChannel).map(([channel, revenue]) => ({
    channel,
    revenue,
  }))

  const healthData = [
    { name: 'Óptima', value: enjambre.colmenas.byHealth.optima, color: SALUD_OPTIMA },
    { name: 'Atención', value: enjambre.colmenas.byHealth.atencion, color: ORO_MIEL },
    { name: 'Riesgo', value: enjambre.colmenas.byHealth.riesgo, color: SALUD_RIESGO },
  ].filter(d => d.value > 0)

  const cashWithIncome = finanzas.cashFlow.filter((cf) => cf.income > 0);
  const lastIncome = cashWithIncome[cashWithIncome.length - 1]?.income ?? 0;
  const prevIncome = cashWithIncome[cashWithIncome.length - 2]?.income ?? 0;
  const facturacionTrend = prevIncome > 0
    ? { value: `${lastIncome >= prevIncome ? '+' : ''}${Math.round(((lastIncome - prevIncome) / prevIncome) * 100)}%`, isPositive: lastIncome >= prevIncome }
    : undefined;

  return (
    <div className="animate-in relative">
      {isFetching && data ? <LoadingOverlay /> : null}
      {/* ── KPI Hero Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Cosecha YTD"
          value={`${fmtNum(enjambre.cosechas.totalYTD)} kg`}
          icon={<Target size={20} />}
          description={`${enjambre.colmenas.total} colmenas activas.`}
          sparkline={enjambre.cosechas.byMonth.map(m => m.cosecha)}
        />
        <KpiCard
          title="Facturación YTD"
          value={fmtCLP(finanzas.facturacionYTD)}
          icon={<DollarSign size={20} />}
          description={`${fmtCLP(finanzas.facturacionMes)} facturado este mes.`}
          sparkline={finanzas.cashFlow.map(cf => cf.income)}
          trend={facturacionTrend}
        />
        <KpiCard
          title="CO₂ secuestrado"
          value={`${fmtNum(enjambre.arboles.co2Total)} ton`}
          icon={<Leaf size={20} />}
          description={`${enjambre.arboles.totalYTD} árboles plantados YTD.`}
          sparkline={enjambre.arboles.byMonth ?? []}
        />
        <KpiCard
          title="Margen utilidad"
          value={`${finanzas.margenUtilidad}%`}
          icon={<TrendingUp size={20} />}
          description={`Flujo neto acumulado: ${fmtCLP(finanzas.utilidadNetaYTD)}.`}
          trend={{ value: 'Estable', isPositive: true }}
        />
      </div>

      {/* ── Row 1: Producción + Canal ── */}
      <div className="dashboard-grid dashboard-grid-2 mt-6">
        <div className="card animate-in delay-2">
          <div className="section-header">
            <div>
              <div className="section-title">Cosecha {new Date().getFullYear()}</div>
              <div className="section-subtitle">kg por mes · Total: {fmtNum(enjambre.cosechas.totalYTD)} kg</div>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enjambre.cosechas.byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={TEXT_MUTED} />
                <YAxis tick={{ fontSize: 12 }} stroke={TEXT_MUTED} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: 'var(--shadow-md)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.82rem',
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Area type="monotone" dataKey="cosecha" stroke={BOSQUE_ULMO} fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card animate-in delay-3">
          <div className="section-header">
            <div>
              <div className="section-title">Ingresos por Canal</div>
              <div className="section-subtitle">CLP YTD · {ventas.totalVentasYTD} ventas</div>
            </div>
          </div>
          <div className="h-[260px]">
            {channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
                  <YAxis dataKey="channel" type="category" tick={{ fontSize: 12 }} stroke={TEXT_MUTED} width={80} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: 'var(--shadow-md)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.82rem',
                      background: 'hsl(var(--card))',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {channelData.map((entry, idx) => (
                      <Cell key={idx} fill={CHANNEL_COLORS[entry.channel] ?? ORO_MIEL} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-[0.85rem]">
                Sin ventas registradas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Flujo de Caja + Colmenas Health ── */}
      <div className="dashboard-grid dashboard-grid-2-1 mt-6">
        <div className="card animate-in delay-3">
          <div className="section-header">
            <div>
              <div className="section-title">Flujo de Caja</div>
              <div className="section-subtitle">Ingresos vs Egresos YTD (CLP)</div>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={finanzas.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={TEXT_MUTED} />
                <YAxis tick={{ fontSize: 12 }} stroke={TEXT_MUTED} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: 'var(--shadow-md)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.82rem',
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Area type="monotone" dataKey="income" stroke={SALUD_OPTIMA} fill="hsl(var(--success) / 0.12)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke={SALUD_RIESGO} fill="hsl(var(--destructive) / 0.08)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card animate-in delay-4 flex-1">
            <div className="flex items-center gap-2 text-[1rem] mb-4">
              <Hexagon size={18} className="text-accent" /> Estado Colmenas
            </div>
            {healthData.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-[100px] h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={healthData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={2}>
                        {healthData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-4">
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
                Varroa última: <span className={enjambre.inspecciones.latestVarroa > 3 ? 'text-destructive' : 'text-success'} font-semibold>{enjambre.inspecciones.latestVarroa}%</span>
              </div>
            )}
          </div>

          <div className="card animate-in delay-5 flex-1">
            <div className="flex items-center gap-2 text-[1rem] mb-4">
              <TreePine size={18} className="text-success" /> Bosque
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-4 rounded-sm bg-success/8 text-center">
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

      {/* ── Row 3: Finanzas + Equipo ── */}
      <div className="dashboard-grid dashboard-grid-2 mt-6">
        <div className="card animate-in delay-4">
          <div className="section-header">
            <div>
              <div className="section-title">Finanzas</div>
              <div className="section-subtitle">Resumen contable YTD</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-sm bg-success/8">
              <div className="text-[0.72rem] text-muted-foreground mb-1">Ingresos netos</div>
              <div className="text-[1.2rem] font-bold text-success">{fmtCLP(finanzas.ingresosNetosYTD)}</div>
            </div>
            <div className="p-4 rounded-sm bg-destructive/8">
              <div className="text-[0.72rem] text-muted-foreground mb-1">Gastos</div>
              <div className="text-[1.2rem] font-bold text-destructive">{fmtCLP(finanzas.gastosYTD)}</div>
            </div>
            <div className="p-4 rounded-sm bg-accent/10">
              <div className="text-[0.72rem] text-muted-foreground mb-1">Utilidad neta</div>
              <div className="text-[1.2rem] font-bold" style={{ color: finanzas.utilidadNetaYTD >= 0 ? 'hsl(var(--accent))' : 'hsl(var(--destructive))' }}>{fmtCLP(finanzas.utilidadNetaYTD)}</div>
            </div>
            <div className="p-4 rounded-sm bg-muted/50">
              <div className="text-[0.72rem] text-muted-foreground mb-1">IVA por pagar</div>
              <div className="text-[1.2rem] font-bold text-foreground">{fmtCLP(finanzas.ivaPagar)}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-[0.78rem] text-muted-foreground">
            <span>PPM: {fmtCLP(finanzas.ppm)}</span>
            <span>·</span>
            <span>{finanzas.totalFacturasEmitidas} facturas emitidas</span>
            {finanzas.facturasPendientes > 0 && (
              <>
                <span>·</span>
                <span className="badge badge-warning">{finanzas.facturasPendientes} pendientes</span>
              </>
            )}
          </div>
        </div>

        <div className="card animate-in delay-5">
          <div className="section-header">
            <div>
              <div className="section-title">Equipo</div>
              <div className="section-subtitle">{equipo.activeReps} reps activos · Comisiones: {fmtCLP(equipo.comisiones.totalYTD)} YTD</div>
            </div>
          </div>

          {equipo.topRep && (
            <div className="p-4 rounded-sm bg-accent/8 mb-4 flex items-center gap-4">
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
            <div className="px-4 py-2 rounded-sm bg-warning/8 text-[0.78rem] mb-4">
              <span className="text-warning font-semibold">{fmtCLP(equipo.comisiones.pendientes)}</span>
              <span className="text-muted-foreground ml-1"> comisiones pendientes</span>
            </div>
          )}

          <div className="flex gap-6 text-[0.78rem] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Wallet size={14} />
              <span>{equipo.caja.openSessions} sesiones abiertas</span>
            </div>
            <div className="flex items-center gap-2">
              <Percent size={14} />
              <span>Tier ×{equipo.comisiones.avgTierMultiplier}</span>
            </div>
          </div>

          {equipo.leaderboard.length > 0 && (
            <div className="mt-4">
              <div className="text-[0.72rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Leaderboard semanal</div>
              {equipo.leaderboard.slice(0, 3).map((entry, i) => (
                <div key={entry.rep_id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-right font-bold" style={{ color: i === 0 ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}>{i + 1}.</span>
                    <span className="text-[0.82rem] text-foreground">{entry.display_name}</span>
                    <span className="badge badge-gold text-[0.65rem]">{entry.commission_tier}</span>
                  </div>
                  <span className="text-[0.82rem] font-semibold text-accent">{fmtCLP(entry.total_commissions)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}