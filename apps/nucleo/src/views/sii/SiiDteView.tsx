'use client';

import React, { useState, Suspense } from "react";
import { FileText, Plus, Receipt, Settings2, Calculator, Users, RefreshCw, BookOpen, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { viewLoadingFallback } from "@/lib/navigation/lazy-view";

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
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="animate-spin text-accent" size={22} />
    </div>
  );
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
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <FileText size={20} />
        </div>
        <div>
          <h1 className="font-display text-3xl text-foreground">SII · Facturación Electrónica</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestión integral de DTEs, impuestos (F29/F22) y honorarios
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        <div className="flex bg-surface-sunken p-1 rounded-lg border border-border w-max min-w-full md:min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                data-testid={`sii-tab-${tab.id}`}
                onClick={() => setMode(tab.id as SiiMode)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

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