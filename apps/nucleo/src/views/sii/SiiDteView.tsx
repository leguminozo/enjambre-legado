import React, { useState } from "react";
import { FileText, Plus, Receipt, Settings2, Calculator, Users, RefreshCw, BookOpen } from "lucide-react";
import { DashboardTab } from "./components/DashboardTab";
import { FacturaCompraForm } from "./components/FacturaCompraForm";
import { GastoExtranjeroTab } from "./components/GastoExtranjeroTab";
import { SettingsTab } from "./components/SettingsTab";
import { ImpuestosTab } from "./components/ImpuestosTab";
import { HonorariosTab } from "./components/HonorariosTab";
import { RcvTab } from "./components/RcvTab";

export function SiiDteView() {
  const [mode, setMode] = useState<"list" | "manual" | "gasto" | "settings" | "f29" | "f22" | "honorarios" | "rcv">("list");

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          <FileText size={20} />
        </div>
        <div>
          <h1 className="font-display text-4xl font-light tracking-tight text-foreground">
            SII · Factura de Compra
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            Emisión DTE tipo 46 — gastos nacionales y extranjeros
          </p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setMode("list")}
          className={`btn flex items-center gap-2 ${mode === "list" ? "btn-gold" : "btn-outline"}`}
        >
          <FileText size={16} /> Listado
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`btn flex items-center gap-2 ${mode === "manual" ? "btn-gold" : "btn-outline"}`}
        >
          <Plus size={16} /> Manual
        </button>
        <button
          onClick={() => setMode("gasto")}
          className={`btn flex items-center gap-2 ${mode === "gasto" ? "btn-gold" : "btn-outline"}`}
        >
          <Receipt size={16} /> Desde recibo
        </button>
        <button
          onClick={() => setMode("settings")}
          className={`btn flex items-center gap-2 ${mode === "settings" ? "btn-gold" : "btn-outline"}`}
        >
          <Settings2 size={16} /> Config SII
        </button>
        <button
          onClick={() => setMode("f29")}
          className={`btn flex items-center gap-2 ${mode === "f29" ? "btn-gold" : "btn-outline"}`}
        >
          <Calculator size={16} /> F29
        </button>
        <button
          onClick={() => setMode("honorarios")}
          className={`btn flex items-center gap-2 ${mode === "honorarios" ? "btn-gold" : "btn-outline"}`}
        >
          <Users size={16} /> Honorarios
        </button>
        <button
          onClick={() => setMode("rcv")}
          className={`btn flex items-center gap-2 ${mode === "rcv" ? "btn-gold" : "btn-outline"}`}
        >
          <RefreshCw size={16} /> RCV
        </button>
        <button
          onClick={() => setMode("f22")}
          className={`btn flex items-center gap-2 ${mode === "f22" ? "btn-gold" : "btn-outline"}`}
        >
          <BookOpen size={16} /> F22
        </button>
      </div>

      <div className="pt-2">
        {mode === "list" && <DashboardTab />}
        {mode === "manual" && <FacturaCompraForm onComplete={() => setMode("list")} />}
        {mode === "gasto" && <GastoExtranjeroTab />}
        {mode === "settings" && <SettingsTab />}
        {mode === "f29" && <ImpuestosTab key="f29-tab" initialType="f29" />}
        {mode === "f22" && <ImpuestosTab key="f22-tab" initialType="f22" />}
        {mode === "honorarios" && <HonorariosTab />}
        {mode === "rcv" && <RcvTab />}
      </div>
    </div>
  );
}
