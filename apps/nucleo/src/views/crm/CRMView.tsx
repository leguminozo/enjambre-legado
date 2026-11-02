import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { OverviewTab } from "./components/OverviewTab";
import { ClientesTab } from "./components/ClientesTab";
import { InteraccionesTab } from "./components/InteraccionesTab";
import { FeriasTab } from "./components/FeriasTab";
import { AliadosB2BTab } from "./components/AliadosB2BTab";
import { ReservasTab } from "./components/ReservasTab";
import { CRMDashboard, EMPTY_DASHBOARD } from "./types";
import { ViewShell } from "@/components/layout/ViewShell";
import { CrmOverviewSkeleton } from "@/components/shared/skeletons";

type CrmTab = "overview" | "clientes" | "reservas" | "interacciones" | "ferias" | "aliados";

const TAB_FROM_PARAM: Record<string, CrmTab> = {
  overview: "overview",
  clientes: "clientes",
  reservas: "reservas",
  interacciones: "interacciones",
  ferias: "ferias",
  aliados: "aliados",
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

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <ViewShell
          variant="compact"
          eyebrow="Mercado · Relaciones"
          title="CRM Clientes & B2B"
          subtitle="Historial de interacciones, métricas de conversión y aliados comerciales."
          icon={<Users size={20} />}
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value as CrmTab)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-10"
            aria-label="Seleccionar vista CRM"
          >
            <option value="overview">Vista: Resumen General</option>
            <option value="reservas">Vista: Reserva Anual (Pre-órdenes)</option>
            <option value="clientes">Vista: Clientes Registrados</option>
            <option value="interacciones">Vista: Bitácora de Interacciones</option>
            <option value="aliados">Vista: Aliados B2B</option>
            <option value="ferias">Vista: Agenda de Ferias</option>
          </select>
        </div>
      </div>

      {isLoading && <CrmOverviewSkeleton />}

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive text-destructive text-sm">
          Error: {error instanceof Error ? error.message : "Error desconocido"}
        </div>
      )}

      {!isLoading && !error && (
        <div className="pt-2">
          {tab === "overview" && <OverviewTab dashboard={dashboard} />}
          {tab === "reservas" && <ReservasTab />}
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
        </div>
      )}
    </div>
  );
}
