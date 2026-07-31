/**
 * Tipos del dashboard `/api/dashboard/resumen` — single source of truth.
 *
 * Refleja el contrato completo del endpoint (`apps/nucleo/src/api/routes/dashboard-resumen.ts`):
 * todos los sub-campos son obligatorios salvo `equipo.topRep` (que puede ser `null`).
 * Los widgets que deban tolerar cargas parciales aplican fallbacks (`??`) en sus props.
 *
 * Consumidores: `gerente/DashboardResumen.tsx`, `enjambre/EcosistemaDashboard.tsx`
 * y `enjambre/widgets/*Widget.tsx`.
 */

export interface EnjambreColmenas {
  total: number
  byHealth: { optima: number; atencion: number; riesgo: number }
  productionTotal: number
}

export interface EnjambreData {
  colmenas: EnjambreColmenas
  apiarios: { total: number }
  inspecciones: { totalYTD: number; latestVarroa: number | null }
  cosechas: { totalYTD: number; byMonth: { month: string; cosecha: number }[] }
  arboles: { totalYTD: number; co2Total: number; byMonth: number[] }
}

export interface FinanzasData {
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

export interface EquipoEntry {
  rep_id: string
  display_name: string
  commission_tier: string
  total_commissions: number
  total_sales: number
}

export interface EquipoData {
  activeReps: number
  repTiers: { base: number; senior: number; elite: number; legend: number }
  topRep: { name: string; revenue: number } | null
  comisiones: { totalYTD: number; pendientes: number; avgTierMultiplier: number }
  caja: { openSessions: number; avgCashDifference: number; recentCount: number }
  leaderboard: EquipoEntry[]
}

export interface VentasData {
  totalVentasYTD: number
  facturacionYTD: number
  newClientsYTD: number
  byChannel: Record<string, number>
  revenueByProductType: Record<string, { revenue: number; count: number }>
  recent: { total: number; channel: string | null; created_at: string | null }[]
}

export interface ResumenData {
  enjambre: EnjambreData
  finanzas: FinanzasData
  ventas: VentasData
  equipo: EquipoData
}
