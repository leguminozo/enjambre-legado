import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calculator, BookOpen, Loader2, Save, CheckCircle2 } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatCurrency } from "@/lib/format";

interface ImpuestosTabProps {
  initialType: "f29" | "f22";
}

export function ImpuestosTab({ initialType }: ImpuestosTabProps) {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();
  const [activeSubTab, setActiveSubTab] = useState<"f29" | "f22">(initialType);

  // F29 States
  const [f29Anio, setF29Anio] = useState(String(new Date().getFullYear()));
  const [f29Mes, setF29Mes] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [f29GuardarAnio, setF29GuardarAnio] = useState(0);
  const [f29GuardarMes, setF29GuardarMes] = useState(0);

  // F22 States
  const [f22Anio, setF22Anio] = useState(String(new Date().getFullYear() - 1));

  // Queries
  const f29Query = useQuery({
    queryKey: ["sii", "f29", f29Anio, f29Mes],
    queryFn: async () => {
      const res = await apiFetch(`/api/sii/f29/${f29Anio}/${f29Mes}`);
      if (!res.ok) throw new Error("Error cargando F29");
      const json = await res.json();
      return json.data as Record<string, unknown>;
    },
    enabled: activeSubTab === "f29" && f29Anio.length === 4 && f29Mes.length >= 1,
    retry: false,
  });

  const f22Query = useQuery({
    queryKey: ["sii", "f22", f22Anio],
    queryFn: async () => {
      const res = await apiFetch(`/api/sii/f22/${f22Anio}`);
      if (!res.ok) throw new Error("Error cargando F22");
      const json = await res.json();
      return json.data as Record<string, unknown>;
    },
    enabled: activeSubTab === "f22" && f22Anio.length === 4,
    retry: false,
  });

  // Mutations
  const guardarF29 = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/sii/f29/${f29GuardarAnio}/${f29GuardarMes}/guardar`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error guardando F29");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex gap-2 border-b border-border pb-px">
        <button
          onClick={() => setActiveSubTab("f29")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === "f29"
              ? "border-accent text-accent font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calculator size={14} /> F29 Mensual
        </button>
        <button
          onClick={() => setActiveSubTab("f22")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === "f22"
              ? "border-accent text-accent font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen size={14} /> F22 Anual
        </button>
      </div>

      {activeSubTab === "f29" && (
        <section className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display text-lg mb-4 flex items-center gap-2 text-foreground">
            <Calculator size={18} /> Declaración F29
          </h3>

          <div className="flex gap-3 mb-6 max-w-md">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Año</label>
              <input
                value={f29Anio}
                onChange={(e) => setF29Anio(e.target.value)}
                type="number"
                min="2000"
                max="2099"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Mes</label>
              <select
                value={f29Mes}
                onChange={(e) => setF29Mes(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={String(m).padStart(2, "0")}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {f29Query.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-accent" size={24} />
            </div>
          ) : f29Query.isError ? (
            <p className="text-sm text-destructive">{f29Query.error.message}</p>
          ) : f29Query.data ? (
            <>
              <div className="space-y-3 max-w-lg">
                <F29LineItem label="Débito facturas (cod 503)" value={Number(f29Query.data.debitoFacturas ?? 0)} />
                <F29LineItem label="Débito boletas (cod 110)" value={Number(f29Query.data.debitoBoletas ?? 0)} />
                <F29LineItem label="Total débito IVA" value={Number(f29Query.data.totalDebito ?? 0)} />
                <div className="border-t border-border pt-2" />
                <F29LineItem label="Crédito facturas nacionales (cod 538)" value={Number(f29Query.data.creditoFacturas ?? 0)} />
                <F29LineItem label="Crédito FC digital (cod 519/520)" value={Number(f29Query.data.creditoFacturaCompraDigital ?? 0)} />
                <F29LineItem label="Total crédito IVA" value={Number(f29Query.data.totalCredito ?? 0)} />
                <div className="border-t border-border pt-2" />
                <F29LineItem label="Remanente CF anterior reajustado (cod 504)" value={Number(f29Query.data.remanenteCFAnteriorReajustado ?? 0)} />
                <F29LineItem label="Remanente CF período" value={Number(f29Query.data.remanenteCFPeriodo ?? 0)} />
                <div className="border-t border-border pt-2" />
                <F29LineItem label="IVA a pagar (cod 89)" value={Number(f29Query.data.ivaPagar ?? 0)} highlight />
                <F29LineItem label="Remanente CF siguiente (cod 77)" value={Number(f29Query.data.remanenteCFSiguiente ?? 0)} />
                <div className="border-t border-border pt-2" />
                <F29LineItem label="Retención honorarios (cod 151)" value={Number(f29Query.data.retencionHonorarios ?? 0)} />
                <F29LineItem label="PPM base (cod 563)" value={Number(f29Query.data.ppmBase ?? 0)} />
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                  <span>PPM tasa (cod 115): {(Number(f29Query.data.ppmTasa ?? 0) * 100).toFixed(3)}%</span>
                </div>
                <F29LineItem label="PPM monto (cod 62)" value={Number(f29Query.data.ppmMonto ?? 0)} highlight />
              </div>

              <div className="border-t border-border pt-4 mt-6 flex items-center gap-3">
                <button
                  onClick={() => {
                    setF29GuardarAnio(Number(f29Anio));
                    setF29GuardarMes(Number(f29Mes));
                    guardarF29.mutate();
                  }}
                  disabled={guardarF29.isPending}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  {guardarF29.isPending ? <Loader2 className="animate-spin text-accent-foreground" size={16} /> : <Save size={14} />} Guardar F29
                </button>
                {guardarF29.isSuccess && (
                  <span className="text-sm text-primary flex items-center gap-1">
                    <CheckCircle2 size={14} /> Guardada
                  </span>
                )}
                {guardarF29.isError && <span className="text-sm text-destructive">{guardarF29.error.message}</span>}
              </div>
            </>
          ) : null}
        </section>
      )}

      {activeSubTab === "f22" && (
        <section className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display text-lg mb-4 flex items-center gap-2 text-foreground">
            <BookOpen size={18} /> Declaración F22 — Anual
          </h3>

          <div className="flex gap-3 mb-6 max-w-xs">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Año comercial</label>
              <input
                value={f22Anio}
                onChange={(e) => setF22Anio(e.target.value)}
                type="number"
                min="2000"
                max="2099"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          {f22Query.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-accent" size={24} />
            </div>
          ) : f22Query.isError ? (
            <p className="text-sm text-destructive">{f22Query.error.message}</p>
          ) : f22Query.data ? (() => {
            const f22 = f22Query.data;
            const isTransparente = f22.regimen === "pro_pyme_transparente";
            return (
              <div className="space-y-3 max-w-lg">
                <div className="p-3 bg-secondary rounded-lg text-xs text-muted-foreground border border-border">
                  Régimen: <span className="text-foreground font-bold">{String(f22.regimen ?? "")}</span>
                  {isTransparente && <span className="ml-2 text-primary font-semibold">(Transparencia — IDPC exenta)</span>}
                </div>

                {isTransparente && (
                  <>
                    <F29LineItem label="Base imponible transparencia (cod 1609)" value={Number(f22.baseImponibleTransparente ?? 0)} />
                    <F29LineItem label="Atribución al dueño (cod 1610)" value={Number(f22.atribucionDueno ?? 0)} />
                  </>
                )}

                <div className="border-t border-border pt-2" />
                <F29LineItem label="PPM total pagado en el año" value={Number(f22.ppmTotalPagado ?? 0)} />
                <F29LineItem label="PPM crédito personal DJ 1947 (cod 1645)" value={Number(f22.ppmCreditoPersonal ?? 0)} />
                <div className="border-t border-border pt-2" />
                <F29LineItem label="Retenciones honorarios total (cod 1665)" value={Number(f22.retencionesHonorariosTotal ?? 0)} />
                <F29LineItem label="IVA débito anual" value={Number(f22.ivaDebitoAnual ?? 0)} />
                <F29LineItem label="IVA crédito anual" value={Number(f22.ivaCreditoAnual ?? 0)} />
              </div>
            );
          })() : null}
        </section>
      )}
    </div>
  );
}

function F29LineItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const isNegative = value < 0;
  return (
    <div className={`flex justify-between items-center py-1.5 ${highlight ? "font-bold text-foreground" : "text-sm text-muted-foreground"}`}>
      <span className={highlight ? "" : "text-muted-foreground"}>{label}</span>
      <span className={`${highlight ? "text-foreground" : "text-foreground font-mono"} ${highlight && value > 0 ? "text-destructive" : ""}`}>
        {(isNegative ? "-" : "") + formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
