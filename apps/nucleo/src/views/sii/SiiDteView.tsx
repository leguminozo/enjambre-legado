'use client';

import React, { useState, Suspense } from "react";
import { ViewLoading } from "@enjambre/ui";
import { FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { viewLoadingFallback } from "@/lib/navigation/lazy-view";
import { ViewShell } from "@/components/layout/ViewShell";

const DashboardTab = dynamic(() => import("./components/DashboardTab").then((m) => ({ default: m.DashboardTab })), {
  loading: () => viewLoadingFallback("DTEs"),
});
const FacturaCompraForm = dynamic(
  () => import("./components/FacturaCompraForm").then((m) => ({ default: m.FacturaCompraForm })),
  { loading: () => viewLoadingFallback("Nueva factura") },
);
const BandejaFiscalTab = dynamic(
  () => import("./components/BandejaFiscalTab").then((m) => ({ default: m.BandejaFiscalTab })),
  { loading: () => viewLoadingFallback("Bandeja fiscal") },
);
const SettingsTab = dynamic(() => import("./components/SettingsTab").then((m) => ({ default: m.SettingsTab })), {
  loading: () => viewLoadingFallback("Configuración SII"),
});

type SiiMode = "list" | "manual" | "gasto" | "settings";

function TabFallback() {
  return <ViewLoading variant="inline" label="Módulo fiscal" hideLabel className="py-10" />;
}

export function SiiDteView() {
  const [mode, setMode] = useState<SiiMode>("list");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <ViewShell
          variant="compact"
          eyebrow="SII · Fiscal"
          title="DTE & Facturación SII"
          subtitle="Emisión, recepción y gestión de Documentos Tributarios Electrónicos (DTE)."
          icon={<FileText size={20} />}
        />

        <div className="flex items-center gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as SiiMode)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-10"
            aria-label="Seleccionar vista DTE"
          >
            <option value="list">Vista: Dashboard DTEs</option>
            <option value="manual">Vista: Emitir Factura Compra</option>
            <option value="gasto">Vista: Bandeja de Gastos</option>
            <option value="settings">Vista: Certificados & Folios CAF</option>
          </select>
        </div>
      </div>

      <div className="pt-2">
        <Suspense fallback={<TabFallback />}>
          {mode === "list" && <DashboardTab />}
          {mode === "manual" && <FacturaCompraForm onComplete={() => setMode("list")} />}
          {mode === "gasto" && <BandejaFiscalTab />}
          {mode === "settings" && <SettingsTab />}
        </Suspense>
      </div>
    </div>
  );
}