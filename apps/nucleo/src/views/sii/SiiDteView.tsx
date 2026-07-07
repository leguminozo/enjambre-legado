'use client';

import React, { useState, Suspense } from "react";
import { ViewLoading } from "@enjambre/ui";
import { FileText, Plus, Receipt, Settings2, Calculator, Users, RefreshCw, BookOpen } from "lucide-react";
import dynamic from "next/dynamic";
import { viewLoadingFallback } from "@/lib/navigation/lazy-view";
import { ViewShell } from "@/components/layout/ViewShell";
import { ResponsiveTabBar } from "@/components/layout/ResponsiveTabBar";

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
const ImpuestosTab = dynamic(() => import("./components/ImpuestosTab").then((m) => ({ default: m.ImpuestosTab })), {
  loading: () => viewLoadingFallback("Impuestos"),
});
const HonorariosTab = dynamic(() => import("./components/HonorariosTab").then((m) => ({ default: m.HonorariosTab })), {
  loading: () => viewLoadingFallback("Honorarios"),
});
const RcvTab = dynamic(() => import("./components/RcvTab").then((m) => ({ default: m.RcvTab })), {
  loading: () => viewLoadingFallback("RCV"),
});

type SiiMode = "list" | "manual" | "gasto" | "settings" | "f29" | "f22" | "honorarios" | "rcv";

function TabFallback() {
  return <ViewLoading variant="inline" label="Módulo fiscal" hideLabel className="py-10" />;
}

export function SiiDteView() {
  const [mode, setMode] = useState<SiiMode>("list");

  const tabs = [
    { id: "list", label: "Listado DTEs", icon: FileText },
    { id: "manual", label: "Nueva Manual", icon: Plus },
    { id: "gasto", label: "Bandeja Fiscal", icon: Receipt },
    { id: "rcv", label: "Registro C/V", icon: RefreshCw },
    { id: "honorarios", label: "Honorarios", icon: Users },
    { id: "f29", label: "F29", icon: Calculator },
    { id: "f22", label: "F22", icon: BookOpen },
    { id: "settings", label: "Configuración", icon: Settings2 },
  ] as const;

  return (
    <div className="space-y-6">
      <ViewShell
        variant="compact"
        eyebrow="Fiscal"
        title="SII · Facturación Electrónica"
        subtitle="Gestión integral de DTEs, impuestos (F29/F22) y honorarios"
        icon={<FileText size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="sii-tabs"
        tabs={tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: <tab.icon size={16} />,
          testId: `sii-tab-${tab.id}`,
        }))}
        activeId={mode}
        onChange={(id) => setMode(id as SiiMode)}
      />

      <div className="pt-2">
        <Suspense fallback={<TabFallback />}>
          {mode === "list" && <DashboardTab />}
          {mode === "manual" && <FacturaCompraForm onComplete={() => setMode("list")} />}
          {mode === "gasto" && <BandejaFiscalTab />}
          {mode === "settings" && <SettingsTab />}
          {mode === "f29" && <ImpuestosTab key="f29-tab" initialType="f29" />}
          {mode === "f22" && <ImpuestosTab key="f22-tab" initialType="f22" />}
          {mode === "honorarios" && <HonorariosTab />}
          {mode === "rcv" && <RcvTab />}
        </Suspense>
      </div>
    </div>
  );
}