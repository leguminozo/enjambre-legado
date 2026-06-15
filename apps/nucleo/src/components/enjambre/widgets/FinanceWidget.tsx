'use client'

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign } from 'lucide-react'

function fmtCLP(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export function FinanceWidget({ data }: { data: any }) {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-border bg-card p-6 overflow-hidden relative">
      {/* Background soft gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <DollarSign size={18} />
            <span className="font-semibold text-sm tracking-wide">Flujo Vital</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground">{fmtCLP(data.facturacionYTD)}</h2>
          <p className="text-xs text-muted-foreground mt-1">Facturación YTD • {fmtCLP(data.facturacionMes)} este mes</p>
        </div>
        
        <div className="px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-semibold flex items-center gap-1 border border-success/20">
          <TrendingUp size={14} />
          <span>Equilibrio</span>
        </div>
      </div>

      <div className="flex-1 min-h-[160px] -mx-2 mt-auto relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.cashFlow}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.4)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card) / 0.95)',
                backdropFilter: 'blur(8px)',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
              formatter={(value: any) => fmtCLP(Number(value || 0))}
            />
            <Area type="monotone" dataKey="income" name="Ingresos" stroke="hsl(var(--success))" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
            <Area type="monotone" dataKey="expenses" name="Gastos" stroke="hsl(var(--destructive))" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
