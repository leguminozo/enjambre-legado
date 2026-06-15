'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Hexagon } from 'lucide-react'

export function HealthWidget({ enjambre }: { enjambre: any }) {
  const healthData = [
    { name: 'Óptima', value: enjambre.colmenas.byHealth.optima, color: 'hsl(var(--success))' },
    { name: 'Atención', value: enjambre.colmenas.byHealth.atencion, color: 'hsl(var(--warning))' },
    { name: 'Riesgo', value: enjambre.colmenas.byHealth.riesgo, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-accent">
          <Hexagon size={18} />
          <span className="font-semibold text-sm text-foreground">Salud del Enjambre</span>
        </div>
      </div>
      
      {healthData.length > 0 ? (
        <div className="flex-1 flex flex-col justify-center gap-6">
          <div className="h-32 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
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
            </ResponsiveContainer>
            
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-xl font-bold text-foreground leading-none">{enjambre.colmenas.total}</span>
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
