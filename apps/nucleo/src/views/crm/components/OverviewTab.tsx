import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { ChartBox } from "@/components/charts/ChartBox";
import { MessageSquare } from "lucide-react";
import { BOSQUE_ULMO, ORO_MIEL } from "@/lib/colors";
import {
  CRMDashboard,
  TIER_BADGE,
  TIPO_ICONS,
  RESULTADO_COLORS,
} from "../types";

interface OverviewTabProps {
  dashboard: CRMDashboard;
}

export function OverviewTab({ dashboard }: OverviewTabProps) {
  const stats = dashboard.stats;

  const channelData = Object.entries(stats.channelRevenue).map(([ch, rev]) => ({
    name: ch,
    revenue: Number(rev),
    count: stats.channelCount[ch] ?? 0,
  }));

  const statusPieData = Object.entries(stats.clientesByStatus).map(([s, count]) => ({
    name: s,
    value: count,
  }));

  const fuenteData = Object.entries(stats.clientesByFuente).map(([f, count]) => ({
    name: f,
    value: count,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        {/* Rendimiento Reps */}
        <div className="card bg-card border border-border rounded-2xl p-6">
          <div className="section-header mb-4">
            <h3 className="section-title text-lg font-display font-medium text-foreground">
              Rendimiento Reps
            </h3>
          </div>
          <div className="space-y-2">
            {dashboard.reps
              .sort((a, b) => b.total_revenue - a.total_revenue)
              .map((rep) => (
                <div
                  key={rep.rep_id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50 hover:border-accent/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {rep.display_name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                          TIER_BADGE[rep.tier] ?? TIER_BADGE.base
                        }`}
                      >
                        {rep.tier}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {rep.total_sales} ventas · {rep.clients_captured} clientes · {rep.streak} días racha
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-foreground">
                      ${Number(rep.total_revenue).toLocaleString("es-CL")}
                    </div>
                    {rep.commission_balance > 0 && (
                      <div className="text-xs text-accent">
                        ${Number(rep.commission_balance).toLocaleString("es-CL")} pend.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            {dashboard.reps.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Sin reps activos
              </div>
            )}
          </div>
        </div>

        {/* Ventas por Canal */}
        {channelData.length > 0 && (
          <div className="card bg-card border border-border rounded-2xl p-6">
            <div className="section-header mb-4">
              <h3 className="section-title text-lg font-display font-medium text-foreground">
                Ventas por Canal
              </h3>
            </div>
            <ChartBox height={224}>
              <BarChart data={channelData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(val) => [`$${Number(val).toLocaleString("es-CL")}`, "Ingresos"]}
                />
                <Bar dataKey="revenue" fill={BOSQUE_ULMO} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartBox>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Clientes por Estado */}
        {statusPieData.length > 0 && (
          <div className="card bg-card border border-border rounded-2xl p-6">
            <div className="section-header mb-2">
              <h3 className="section-title text-lg font-display font-medium text-foreground">
                Clientes por Estado
              </h3>
            </div>
            <ChartBox height={192}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={[BOSQUE_ULMO, ORO_MIEL, "hsl(var(--muted-foreground))", "hsl(var(--destructive))"][idx % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ChartBox>
            <div className="flex flex-wrap gap-x-4 gap-y-2 px-2 mt-2">
              {statusPieData.map((s) => (
                <span key={s.name} className="text-xs text-muted-foreground">
                  {s.name}: <strong className="text-foreground font-semibold">{s.value}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Últimas Interacciones */}
        <div className="card bg-card border border-border rounded-2xl p-6">
          <div className="section-header mb-4">
            <h3 className="section-title text-lg font-display font-medium text-foreground">
              Últimas Interacciones
            </h3>
          </div>
          <div className="space-y-2">
            {dashboard.interacciones.slice(0, 8).map((inter) => {
              const cliente = dashboard.clientes.find((c) => c.id === inter.cliente_id);
              return (
                <div
                  key={inter.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/30 transition-colors border border-transparent hover:border-border/55"
                >
                  <div className="text-muted-foreground shrink-0">
                    {TIPO_ICONS[inter.tipo] ?? <MessageSquare size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {cliente?.name ?? "Cliente"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {inter.tipo} · {new Date(inter.created_at).toLocaleDateString("es-CL")}
                    </div>
                  </div>
                  {inter.resultado && (
                    <span className={`text-xs font-semibold uppercase ${RESULTADO_COLORS[inter.resultado] ?? ""}`}>
                      {inter.resultado}
                    </span>
                  )}
                </div>
              );
            })}
            {dashboard.interacciones.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Sin interacciones registradas
              </div>
            )}
          </div>
        </div>

        {/* Fuentes de Clientes */}
        {fuenteData.length > 0 && (
          <div className="card bg-card border border-border rounded-2xl p-6">
            <div className="section-header mb-4">
              <h3 className="section-title text-lg font-display font-medium text-foreground">
                Fuentes de Clientes
              </h3>
            </div>
            <div className="space-y-3">
              {fuenteData
                .sort((a, b) => b.value - a.value)
                .map((f) => {
                  const pct = stats.totalClientes > 0 ? Math.round((f.value / stats.totalClientes) * 100) : 0;
                  return (
                    <div key={f.name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20 truncate">{f.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-secondary/80 overflow-hidden border border-border/40">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground w-8 text-right font-mono">{pct}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
