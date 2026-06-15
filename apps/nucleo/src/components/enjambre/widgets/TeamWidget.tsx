'use client'

import React from 'react'
import { Trophy, Users } from 'lucide-react'

function fmtCLP(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export function TeamWidget({ equipo }: { equipo: any }) {
  return (
    <div className="flex flex-col h-full bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Users size={18} />
            <span className="font-semibold text-sm text-foreground">Comunidad</span>
          </div>
          <h3 className="text-xl font-bold text-foreground">{equipo.activeReps} <span className="text-sm font-normal text-muted-foreground">Embajadores activos</span></h3>
        </div>
      </div>

      {equipo.topRep && (
        <div className="p-4 rounded-xl bg-surface-sunken border border-border/50 mb-6 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 shadow-[0_0_15px_rgba(var(--accent),0.2)]">
            <Trophy size={18} className="text-accent" />
          </div>
          <div className="relative z-10">
             <div className="text-sm font-bold text-foreground">{equipo.topRep.name}</div>
             <div className="text-xs text-muted-foreground">Top Guadián • {fmtCLP(equipo.topRep.revenue)}</div>
          </div>
        </div>
      )}

      {equipo.leaderboard?.length > 0 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider mb-3">Voces del Legado</div>
          <div className="flex flex-col gap-3">
            {equipo.leaderboard.slice(0, 3).map((entry: any, i: number) => (
              <div key={entry.rep_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-4 text-xs font-bold text-right ${i === 0 ? 'text-accent' : 'text-muted-foreground'}`}>{i + 1}.</span>
                  <span className="text-sm text-foreground">{entry.display_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded-full border border-border/50 bg-background text-muted-foreground">{entry.commission_tier}</span>
                  <span className="text-sm font-semibold text-primary">{fmtCLP(entry.total_commissions)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
