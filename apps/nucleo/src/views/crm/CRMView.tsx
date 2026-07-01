import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, MessageSquare, Calendar, Target, Loader2, Shield, Star } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { OverviewTab } from "./components/OverviewTab";
import { ClientesTab } from "./components/ClientesTab";
import { InteraccionesTab } from "./components/InteraccionesTab";
import { FeriasTab } from "./components/FeriasTab";
import { AliadosB2BTab } from "./components/AliadosB2BTab";
import { ResenasSensorialesTab } from "./components/ResenasSensorialesTab";
import { CRMDashboard, EMPTY_DASHBOARD } from "./types";
import { ViewShell } from "@/components/layout/ViewShell";
import { ResponsiveTabBar } from "@/components/layout/ResponsiveTabBar";

type CrmTab = "overview" | "clientes" | "interacciones" | "ferias" | "aliados" | "resenas";

const TAB_FROM_PARAM: Record<string, CrmTab> = {
  overview: "overview",
  clientes: "clientes",
  interacciones: "interacciones",
  ferias: "ferias",
  aliados: "aliados",
  resenas: "resenas",
};

export function CRMView() {
  const apiFetch = useApiFetch();
  const searchParams = useSearchParams();
  const initialTab = TAB_FROM_PARAM[searchParams.get("tab") ?? ""] ?? "overview";
  const [tab, setTab] = useState<CrmTab>(initialTab);

  useEffect(() => {
    const param = searchParams.get("tab");
    if (param && TAB_FROM_PARAM[param]) {
      setTab(TAB_FROM_PARAM[param]);
    }
  }, [searchParams]);
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

  const tabs: { key: CrmTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Vista General", icon: <TrendingUp size={16} /> },
    { key: "clientes", label: "Clientes", icon: <Users size={16} /> },
    { key: "interacciones", label: "Interacciones", icon: <MessageSquare size={16} /> },
    { key: "ferias", label: "Agenda Ferias", icon: <Calendar size={16} /> },
    { key: "aliados", label: "Aliados B2B", icon: <Shield size={16} /> },
    { key: "resenas", label: "Huella Sensorial", icon: <Star size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Relaciones"
        title="CRM de Vendedores"
        subtitle="Historial de interacciones, métricas de conversión y agenda de ferias"
      />

      <div className="stats-grid">
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
          <div key={i} className="stat-card flex flex-col justify-between">
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

      <ResponsiveTabBar
        layoutId="crm-tabs"
        tabs={tabs.map((t) => ({
          id: t.key,
          label: t.label,
          icon: t.icon,
        }))}
        activeId={tab}
        onChange={(id) => setTab(id as CrmTab)}
      />

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
          {tab === "aliados" && <AliadosB2BTab />}
          {tab === "resenas" && <ResenasSensorialesTab />}
        </div>
      )}
    </div>
  );
}
