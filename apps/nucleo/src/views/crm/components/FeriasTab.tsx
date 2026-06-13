import React from "react";
import { Calendar } from "lucide-react";
import { CRMDashboard } from "../types";

interface FeriasTabProps {
  dashboard: CRMDashboard;
}

export function FeriasTab({ dashboard }: FeriasTabProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground font-medium">
        {dashboard.stats.upcomingEventos} evento(s) programado(s)
      </div>

      <div className="space-y-3">
        {dashboard.eventos.map((evento) => {
          const assignedReps = evento.reps ?? [];
          return (
            <div
              key={evento.id}
              className="p-4 rounded-xl bg-card border border-border space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {evento.nombre ?? "Evento sin nombre"}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground font-mono">
                    <Calendar size={12} />
                    {evento.fecha_inicio && new Date(evento.fecha_inicio).toLocaleDateString("es-CL")}
                    {evento.fecha_fin && ` — ${new Date(evento.fecha_fin).toLocaleDateString("es-CL")}`}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-accent/15 text-accent border border-accent/30 uppercase">
                  Feria
                </span>
              </div>

              {assignedReps.length > 0 && (
                <div className="space-y-2 border-t border-border pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Reps Asignados
                  </span>
                  <div className="grid gap-1.5">
                    {assignedReps.map((a) => {
                      const rep = dashboard.reps.find((r) => r.rep_id === a.rep_id);
                      return (
                        <div key={a.id} className="flex items-center gap-2 text-xs text-foreground font-medium">
                          <span>{rep?.display_name ?? a.rep_id.slice(0, 8)}</span>
                          <span className="text-muted-foreground text-[11px]">({a.rol_evento})</span>
                          {a.meta_ventas > 0 && (
                            <span className="text-accent font-mono text-[11px] ml-auto">
                              Meta: ${Number(a.meta_ventas).toLocaleString("es-CL")}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {dashboard.eventos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm bg-card border border-border rounded-2xl">
            <Calendar size={32} className="mx-auto mb-2 opacity-50 text-muted-foreground" />
            Sin eventos programados
          </div>
        )}
      </div>
    </div>
  );
}
