'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useApiFetch } from '@/hooks/use-api-fetch'
import { BentoGrid, BentoGridItem, ViewLoading, ModuleHero } from '@enjambre/ui'
import { CinematicCard } from '@enjambre/ui'
import { Leaf, Target, ArrowUpRight } from 'lucide-react'
import gsap from 'gsap'

// Sub-widgets
import { FinanceWidget } from './widgets/FinanceWidget'
import { HealthWidget } from './widgets/HealthWidget'
import { TeamWidget } from './widgets/TeamWidget'
import { QuickActionAddStock } from './QuickActionAddStock'

interface ResumenData {
  enjambre: any
  finanzas: any
  ventas: any
  equipo: any
}

function fmtCLP(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export function EcosistemaDashboard() {
  const apiFetch = useApiFetch()
  const gridRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, error } = useQuery<ResumenData>({
    queryKey: ['dashboard-resumen'],
    queryFn: async () => {
      const res = await apiFetch('/api/dashboard/resumen')
      if (!res.ok) throw new Error('Failed to fetch resumen')
      return res.json()
    },
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!isLoading && data && gridRef.current) {
      const items = gridRef.current.children
      gsap.fromTo(
        items,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      )
    }
  }, [isLoading, data])

  if (isLoading) {
    return <ViewLoading variant="view" label="Cargando resumen" hideLabel />
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="text-destructive font-semibold mb-2">Pérdida de conexión con el bosque</div>
          <div className="text-muted-foreground text-[0.85rem]">{error?.message ?? 'Sin datos disponibles'}</div>
        </div>
      </div>
    )
  }

  const { enjambre, finanzas, ventas, equipo } = data

  const byChannel = ventas?.byChannel || {}
  const topChannel = Object.entries(byChannel).sort((a: any, b: any) => b[1] - a[1])[0]

  return (
    <div className="flex flex-col gap-8 pb-12 w-full max-w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <ModuleHero
          greeting="Alma del Enjambre"
          title="El Ecosistema Vivo"
          mission="Todo está conectado: finanzas, colmenas, feria e impacto en un solo pulso"
          className="flex-1 min-w-0"
        />
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <Link
            href="/ejecutivo"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Panel ejecutivo <ArrowUpRight size={12} />
          </Link>
          <Link
            href="/monitor-feria"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Monitor feria <ArrowUpRight size={12} />
          </Link>
          <QuickActionAddStock />
        </div>
      </div>

      <div ref={gridRef}>
        {/* Usamos un layout híbrido que funciona bien tanto en móvil como en escritorio */}
        <BentoGrid className="!max-w-none w-full">
          {/* Row 1 */}
          <BentoGridItem colSpan={2} rowSpan={1} className="p-0 bg-background border-none shadow-none">
            <FinanceWidget data={finanzas} />
          </BentoGridItem>

          <BentoGridItem colSpan={1} rowSpan={1}>
            <HealthWidget enjambre={enjambre} />
          </BentoGridItem>

          {/* Row 2 */}
          <BentoGridItem colSpan={1} rowSpan={2} className="p-0 bg-background border-none shadow-none">
             <TeamWidget equipo={equipo} />
          </BentoGridItem>

          <BentoGridItem colSpan={1} rowSpan={1} className="p-0 border-none shadow-none bg-transparent">
            <Link href="/pipeline" className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
              <CinematicCard
                variant="chrome"
                title={topChannel ? `Vía Destacada: ${topChannel[0]}` : 'Vías de Distribución'}
                subtitle={
                  topChannel
                    ? `Aporte YTD: ${fmtCLP(topChannel[1] as number)} · Abrir pipeline`
                    : 'Aún sin aportes · Abrir pipeline'
                }
                badgeText="Distribución"
                className="h-full w-full"
              />
            </Link>
          </BentoGridItem>

          <BentoGridItem colSpan={1} rowSpan={1} className="flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-accent">
                <Leaf size={20} />
                <h3 className="font-semibold text-foreground">Sustentabilidad</h3>
              </div>
              <Link
                href="/regeneracion"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
              >
                Bosque <ArrowUpRight size={12} />
              </Link>
            </div>
            <div>
              <div className="text-4xl font-display font-bold text-success mb-2">{finanzas.margenUtilidad}%</div>
              <p className="text-sm text-muted-foreground">Flujo neto acumulado de {fmtCLP(finanzas.utilidadNetaYTD)} en este ciclo.</p>
            </div>
            <div className="mt-6 flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-4">
              <span>Impacto CO₂: {enjambre.arboles?.co2Total?.toFixed(1) || 0} ton</span>
              <span>Plantados: {enjambre.arboles?.totalYTD || 0}</span>
            </div>
          </BentoGridItem>
          
          <BentoGridItem colSpan={2} rowSpan={1} className="bg-surface-raised border-border flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 gap-4">
             <div className="mb-0 min-w-0">
               <h3 className="text-lg font-bold text-foreground mb-1">Ritmo de Cosecha</h3>
               <p className="text-sm text-muted-foreground">{enjambre.colmenas?.total || 0} colmenas activas entregando {enjambre.cosechas?.totalYTD || 0} kg YTD.</p>
               <div className="mt-3 flex flex-wrap gap-3">
                 <Link href="/colmenas" className="text-xs font-medium text-accent hover:text-accent/80 inline-flex items-center gap-1">
                   Colmenas <ArrowUpRight size={12} />
                 </Link>
                 <Link href="/produccion" className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                   Producción <ArrowUpRight size={12} />
                 </Link>
                 <Link href="/catalogo" className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                   Catálogo <ArrowUpRight size={12} />
                 </Link>
               </div>
             </div>
             <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Target size={24} className="text-primary" />
             </div>
          </BentoGridItem>

        </BentoGrid>
      </div>
    </div>
  )
}
