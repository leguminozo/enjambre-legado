import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, MessageSquare, Calendar, Target, Loader2 } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { OverviewTab } from "./components/OverviewTab";
import { ClientesTab } from "./components/ClientesTab";
import { InteraccionesTab } from "./components/InteraccionesTab";
import { FeriasTab } from "./components/FeriasTab";
import { CRMDashboard, EMPTY_DASHBOARD } from "./types";

export function CRMView() {
  const apiFetch = useApiFetch();
  const [tab, setTab] = useState<"overview" | "clientes" | "interacciones" | "ferias">("overview");
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ data: CRMDashboard }>({
    queryKey: ["crm", "dashboard"],
    queryFn: async () => {
      const res = await apiFetch("/api/crm/dashboard");
      if (!res.ok) throw new Error("Failed to fetch CRM");
      return res.json();
    },
    staleTime: 30_000,
  });

  const dashboard = data?.data ?? EMPTY_DASHBOARD;
  const stats = dashboard.stats;

  const tabs = [
    { key: "overview" as const, label: "Vista General", icon: <TrendingUp size={16} /> },
    { key: "clientes" as const, label: "Clientes", icon: <Users size={16} /> },
    { key: "interacciones" as const, label: "Interacciones", icon: <MessageSquare size={16} /> },
    { key: "ferias" as const, label: "Agenda Ferias", icon: <Calendar size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-in">
      <div className="hero-banner bg-card border border-border p-6 rounded-2xl">
        <h1 className="hero-title font-display text-4xl font-light tracking-tight text-foreground">
          CRM de Vendedores
        </h1>
        <p className="hero-subtitle text-muted-foreground text-sm tracking-wide mt-1">
          Historial de interacciones, métricas de conversión y agenda de ferias
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Users size={20} />, val: String(stats.totalClientes), label: "Total Clientes" },
          { icon: <Target size={20} />, val: `${stats.conversionRate}%`, label: "Conversión" },
          {
            icon: <MessageSquare size={20} />,
            val: String(stats.interaccionesTotal),
            label: "Interacciones",
            trend: stats.proximosSeguimientos > 0 ? `${stats.proximosSeguimientos} seg.` : undefined,
          },
          { icon: <Calendar size={20} />, val: String(stats.upcomingEventos), label: "Próximas Ferias" },
        ].map((s, i) => (
          <div key={i} className="stat-card p-5 rounded-2xl bg-card border border-border flex flex-col justify-between">
            <div className="stat-header flex items-center justify-between mb-2">
              <div className="stat-icon text-accent">{s.icon}</div>
              {s.trend && (
                <span className="stat-trend bg-primary/10 text-primary border border-primary/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {s.trend}
                </span>
              )}
            </div>
            <div>
              <div className="stat-value text-2xl font-display font-semibold text-foreground font-mono">{s.val}</div>
              <div className="stat-label text-xs text-muted-foreground uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b border-border pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === t.key
                ? "border-accent text-accent font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive text-destructive text-sm">
          Error: {error instanceof Error ? error.message : "Error desconocido"}
        </div>
      )}

      {!isLoading && !error && (
        <div className="pt-2">
          {tab === "overview" && <OverviewTab dashboard={dashboard} />}
          {tab === "clientes" && (
            <ClientesTab
              dashboard={dashboard}
              onSelectCliente={(id) => {
                setSelectedClienteId(id);
                setTab("interacciones");
              }}
            />
          )}
          {tab === "interacciones" && (
            <InteraccionesTab dashboard={dashboard} selectedClienteId={selectedClienteId} />
          )}
          {tab === "ferias" && <FeriasTab dashboard={dashboard} />}
        </div>
      )}
    </div>
  );
}
