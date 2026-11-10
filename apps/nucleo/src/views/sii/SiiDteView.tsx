'use client';

import React, { useState, Suspense } from "react";
import { FileText, Plus, Receipt, Settings } from "lucide-react";
import dynamic from "next/dynamic";
import { ViewShell } from "@/components/layout/ViewShell";
import { ResponsiveTabBar } from "@/components/layout/ResponsiveTabBar";
import { FiscalSiiSkeleton } from "@/components/shared/skeletons";

const DashboardTab = dynamic(() => import("./components/DashboardTab").then((m) => ({ default: m.DashboardTab })), {
  loading: () => <FiscalSiiSkeleton />,
});
const FacturaCompraForm = dynamic(
  () => import("./components/FacturaCompraForm").then((m) => ({ default: m.FacturaCompraForm })),
  { loading: () => <FiscalSiiSkeleton /> },
);
const BandejaFiscalTab = dynamic(
  () => import("./components/BandejaFiscalTab").then((m) => ({ default: m.BandejaFiscalTab })),
  { loading: () => <FiscalSiiSkeleton /> },
);
const SettingsTab = dynamic(() => import("./components/SettingsTab").then((m) => ({ default: m.SettingsTab })), {
  loading: () => <FiscalSiiSkeleton />,
});

type SiiMode = "list" | "manual" | "gasto" | "settings";

function TabFallback() {
  return <FiscalSiiSkeleton />;
}

export function SiiDteView() {
  const [mode, setMode] = useState<SiiMode>("list");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        variant="compact"
        eyebrow="SII · Fiscal"
        title="DTE & Facturación SII"
        subtitle="Emisión, recepción y gestión de Documentos Tributarios Electrónicos (DTE)."
        icon={<FileText size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="sii-dte-tabs"
        tabs={[
          { id: "list", label: "Dashboard DTEs", icon: <FileText size={16} /> },
          { id: "manual", label: "Emitir Factura Compra", icon: <Plus size={16} /> },
          { id: "gasto", label: "Bandeja de Gastos", icon: <Receipt size={16} /> },
          { id: "settings", label: "Certificados & Folios CAF", icon: <Settings size={16} /> },
        ]}
        activeId={mode}
        onChange={(id) => setMode(id as SiiMode)}
      />

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