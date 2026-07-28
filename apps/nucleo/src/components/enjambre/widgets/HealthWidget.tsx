'use client'

import React from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ChartBox } from '@/components/charts/ChartBox'
import { Hexagon, ArrowUpRight } from 'lucide-react'
import type { EnjambreData } from '../EcosistemaDashboard'

export function HealthWidget({ enjambre }: { enjambre: EnjambreData }) {
  const byHealth = enjambre.colmenas?.byHealth
  const healthData = [
    { name: 'Óptima', value: byHealth?.optima ?? 0, color: 'hsl(var(--success))' },
    { name: 'Atención', value: byHealth?.atencion ?? 0, color: 'hsl(var(--warning))' },
    { name: 'Riesgo', value: byHealth?.riesgo ?? 0, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-accent">
          <Hexagon size={18} />
          <span className="font-semibold text-sm text-foreground">Salud del Enjambre</span>
        </div>
        <Link
          href="/colmenas"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
        >
          Colmenas <ArrowUpRight size={12} />
        </Link>
      </div>
      
      {healthData.length > 0 ? (
        <div className="flex-1 flex flex-col justify-center gap-6">
          <div className="w-full relative">
            <ChartBox height={128}>
              <PieChart>
                <Pie 
                  data={healthData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={35} 
                  outerRadius={60} 
                  paddingAngle={4}
                  stroke="none"
                >
                  {healthData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ChartBox>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-xl font-bold text-foreground leading-none">{enjambre.colmenas?.total ?? 0}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-2">
            {healthData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-semibold text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Sin datos de colmenas.
        </div>
      )}
    </div>
  )
}
