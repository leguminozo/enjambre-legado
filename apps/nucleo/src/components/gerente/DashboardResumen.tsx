'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, DollarSign, Target, Leaf, Crown, ArrowUpRight, Hexagon, TreePine, Users, Wallet, Percent, Trophy } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { BOSQUE_ULMO, ORO_MIEL, TEXT_MUTED, SALUD_OPTIMA, SALUD_RIESGO } from '@/lib/colors'
import { useApiFetch } from '@/hooks/use-api-fetch'

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

interface ResumenData {
  enjambre: {
    colmenas: { total: number; byHealth: { optima: number; atencion: number; riesgo: number }; productionTotal: number }
    apiarios: { total: number }
    inspecciones: { totalYTD: number; latestVarroa: number | null }
    cosechas: { totalYTD: number; byMonth: { month: string; cosecha: number }[] }
    arboles: { totalYTD: number; co2Total: number }
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

  const { data, isLoading, error } = useQuery<ResumenData>({
    queryKey: ['dashboard-resumen'],
    queryFn: async () => {
      const res = await apiFetch('/api/dashboard/resumen')
      if (!res.ok) throw new Error('Failed to fetch resumen')
      return res.json()
    },
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
        <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Cargando resumen del enjambre...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="animate-in" style={{ padding: 'var(--space-xl)' }}>
        <div className="card" style={{ borderColor: 'hsl(var(--destructive) / 0.3)' }}>
          <div style={{ color: 'hsl(var(--destructive))', fontWeight: 600, marginBottom: 8 }}>Error al cargar datos</div>
          <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>{error?.message ?? 'Sin datos disponibles'}</div>
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

  return (
    <div className="animate-in">
      {/* ── KPI Hero Stats ── */}
      <div className="stats-grid">
        {[
          { icon: <Target size={20} />, val: `${fmtNum(enjambre.cosechas.totalYTD)} kg`, label: 'Cosecha YTD', sub: `${enjambre.colmenas.total} colmenas` },
          { icon: <DollarSign size={20} />, val: fmtCLP(finanzas.facturacionYTD), label: 'Facturación YTD', sub: `${fmtCLP(finanzas.facturacionMes)} este mes` },
          { icon: <Leaf size={20} />, val: `${fmtNum(enjambre.arboles.co2Total)} ton`, label: 'CO₂ secuestrado', sub: `${enjambre.arboles.totalYTD} árboles YTD` },
          { icon: <TrendingUp size={20} />, val: `${finanzas.margenUtilidad}%`, label: 'Margen utilidad', sub: fmtCLP(finanzas.utilidadNetaYTD) },
        ].map((s, i) => (
          <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
            <div className="stat-header">
              <div className="stat-icon">{s.icon}</div>
              {s.sub && <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>{s.sub}</span>}
            </div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Producción + Canal ── */}
      <div className="dashboard-grid dashboard-grid-2" style={{ marginTop: 'var(--space-lg)' }}>
        <div className="card animate-in delay-2">
          <div className="section-header">
            <div>
              <div className="section-title">Cosecha {new Date().getFullYear()}</div>
              <div className="section-subtitle">kg por mes · Total: {fmtNum(enjambre.cosechas.totalYTD)} kg</div>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enjambre.cosechas.byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={TEXT_MUTED} />
                <YAxis tick={{ fontSize: 12 }} stroke={TEXT_MUTED} />
                <Tooltip contentStyle={CHART_TOOLTIP} />
                <Area type="monotone" dataKey="cosecha" stroke={BOSQUE_ULMO} fill={`hsl(var(--primary) / 0.15)`} strokeWidth={2} />
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
          <div style={{ height: 260 }}>
            {channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
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
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
                Sin ventas registradas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Flujo de Caja + Colmenas Health ── */}
      <div className="dashboard-grid dashboard-grid-2-1" style={{ marginTop: 'var(--space-lg)' }}>
        <div className="card animate-in delay-3">
          <div className="section-header">
            <div>
              <div className="section-title">Flujo de Caja</div>
              <div className="section-subtitle">Ingresos vs Egresos YTD (CLP)</div>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={finanzas.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={TEXT_MUTED} />
                <YAxis tick={{ fontSize: 12 }} stroke={TEXT_MUTED} />
                <Tooltip contentStyle={CHART_TOOLTIP} />
                <Area type="monotone" dataKey="income" stroke={SALUD_OPTIMA} fill={`hsl(var(--success) / 0.12)`} strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke={SALUD_RIESGO} fill={`hsl(var(--destructive) / 0.08)`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="card animate-in delay-4" style={{ flex: 1 }}>
            <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Hexagon size={18} style={{ color: 'hsl(var(--accent))' }} /> Estado Colmenas
            </div>
            {healthData.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                <div style={{ width: 100, height: 100 }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {healthData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>{d.name}</span>
                      <span style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>Sin colmenas registradas</div>
            )}
            {enjambre.inspecciones.latestVarroa != null && (
              <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--muted) / 0.5)', fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>
                Varroa última: <span style={{ color: enjambre.inspecciones.latestVarroa > 3 ? 'hsl(var(--destructive))' : 'hsl(var(--success))', fontWeight: 600 }}>{enjambre.inspecciones.latestVarroa}%</span>
              </div>
            )}
          </div>

          <div className="card animate-in delay-5" style={{ flex: 1 }}>
            <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TreePine size={18} style={{ color: 'hsl(var(--success))' }} /> Bosque
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--success) / 0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'hsl(var(--success))' }}>{enjambre.arboles.totalYTD}</div>
                <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>Árboles YTD</div>
              </div>
              <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--accent) / 0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'hsl(var(--accent))' }}>{fmtNum(enjambre.arboles.co2Total)}</div>
                <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>ton CO₂</div>
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
              {enjambre.apiarios.total} apiarios · {enjambre.inspecciones.totalYTD} inspecciones YTD
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Finanzas + Equipo ── */}
      <div className="dashboard-grid dashboard-grid-2" style={{ marginTop: 'var(--space-lg)' }}>
        <div className="card animate-in delay-4">
          <div className="section-header">
            <div>
              <div className="section-title">Finanzas</div>
              <div className="section-subtitle">Resumen contable YTD</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--success) / 0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Ingresos netos</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'hsl(var(--success))' }}>{fmtCLP(finanzas.ingresosNetosYTD)}</div>
            </div>
            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--destructive) / 0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Gastos</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'hsl(var(--destructive))' }}>{fmtCLP(finanzas.gastosYTD)}</div>
            </div>
            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--accent) / 0.1)' }}>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Utilidad neta</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: finanzas.utilidadNetaYTD >= 0 ? 'hsl(var(--accent))' : 'hsl(var(--destructive))' }}>{fmtCLP(finanzas.utilidadNetaYTD)}</div>
            </div>
            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--muted) / 0.5)' }}>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>IVA por pagar</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{fmtCLP(finanzas.ivaPagar)}</div>
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)', fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>
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
            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--accent) / 0.08)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'hsl(var(--accent) / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={18} style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{equipo.topRep.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Top rep · {fmtCLP(equipo.topRep.revenue)} lifetime</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
            {Object.entries(equipo.repTiers).map(([tier, count]) => (
              <div key={tier} style={{ textAlign: 'center', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--muted) / 0.3)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: TIER_COLORS[tier] ?? 'hsl(var(--foreground))' }}>{count}</div>
                <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))', textTransform: 'capitalize' }}>{tier}</div>
              </div>
            ))}
          </div>

          {equipo.comisiones.pendientes > 0 && (
            <div style={{ padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-sm)', background: 'hsl(var(--warning) / 0.08)', fontSize: '0.78rem', marginBottom: 'var(--space-md)' }}>
              <span style={{ color: 'hsl(var(--warning))', fontWeight: 600 }}>{fmtCLP(equipo.comisiones.pendientes)}</span>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}> comisiones pendientes</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Wallet size={14} />
              <span>{equipo.caja.openSessions} sesiones abiertas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Percent size={14} />
              <span>Tier ×{equipo.comisiones.avgTierMultiplier}</span>
            </div>
          </div>

          {equipo.leaderboard.length > 0 && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leaderboard semanal</div>
              {equipo.leaderboard.slice(0, 3).map((entry, i) => (
                <div key={entry.rep_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid hsl(var(--border) / 0.3)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: i === 0 ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))', width: 20 }}>{i + 1}.</span>
                    <span style={{ fontSize: '0.82rem', color: 'hsl(var(--foreground))' }}>{entry.display_name}</span>
                    <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>{entry.commission_tier}</span>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(var(--accent))' }}>{fmtCLP(entry.total_commissions)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
