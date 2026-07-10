import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calculator, BookOpen, Save, CheckCircle2 } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent, Button, HexagonLoader, ViewLoading, LoadingOverlay } from "@enjambre/ui";
import { ResponsiveTabBar } from "@/components/layout/ResponsiveTabBar";
import { EnjTableShell } from "@/components/layout/EnjTableShell";

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
      <ResponsiveTabBar
        layoutId={`impuestos-${initialType}`}
        tabs={[
          { id: "f29", label: "F29 Mensual", icon: <Calculator size={14} /> },
          { id: "f22", label: "F22 Anual", icon: <BookOpen size={14} /> },
        ]}
        activeId={activeSubTab}
        onChange={(id) => setActiveSubTab(id as "f29" | "f22")}
      />

      {activeSubTab === "f29" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator size={18} /> Declaración F29
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {f29Query.isFetching && f29Query.data ? <LoadingOverlay label="Actualizando F29" /> : null}
            <div className="flex gap-4 mb-6 max-w-sm">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Año</label>
                <input
                  value={f29Anio}
                  onChange={(e) => setF29Anio(e.target.value)}
                  type="number"
                  min="2000"
                  max="2099"
                  className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Mes</label>
                <select
                  value={f29Mes}
                  onChange={(e) => setF29Mes(e.target.value)}
                  className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
              <ViewLoading variant="view" label="F29" hideLabel />
            ) : f29Query.isError ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-sm">
                {f29Query.error.message}
              </div>
            ) : f29Query.data ? (
              <div className="animate-in fade-in duration-300">
                <div className="space-y-2 bg-surface-sunken p-5 rounded-xl border border-border">
                  <F29LineItem label="Débito facturas (cod 503)" value={Number(f29Query.data.debitoFacturas ?? 0)} />
                  <F29LineItem label="Débito boletas (cod 110)" value={Number(f29Query.data.debitoBoletas ?? 0)} />
                  <F29LineItem label="Total débito IVA" value={Number(f29Query.data.totalDebito ?? 0)} />
                  
                  <div className="border-t border-border my-2" />
                  
                  <F29LineItem label="Crédito facturas nacionales (cod 503)" value={Number(f29Query.data.creditoFacturas ?? 0)} />
                  <F29LineItem label="Cantidad FC46 digitales (cod 519)" value={Number(f29Query.data.cantidadDocsDigital ?? 0)} integer />
                  <F29LineItem label="Monto neto digital (cod 520)" value={Number(f29Query.data.montoNetoDigital ?? 0)} />
                  <F29LineItem label="IVA digital cambio sujeto (cod 511)" value={Number(f29Query.data.creditoFacturaCompraDigital ?? 0)} />
                  <F29LineItem label="Total crédito IVA" value={Number(f29Query.data.totalCredito ?? 0)} />
                  
                  <div className="border-t border-border my-2" />
                  
                  <F29LineItem label="Remanente CF anterior reajustado (cod 504)" value={Number(f29Query.data.remanenteCFAnteriorReajustado ?? 0)} />
                  <F29LineItem label="Remanente CF período" value={Number(f29Query.data.remanenteCFPeriodo ?? 0)} />
                  
                  <div className="border-t border-border my-2" />
                  
                  <F29LineItem label="IVA a pagar (cod 89)" value={Number(f29Query.data.ivaPagar ?? 0)} highlight />
                  <F29LineItem label="Remanente CF siguiente (cod 77)" value={Number(f29Query.data.remanenteCFSiguiente ?? 0)} />
                  
                  <div className="border-t border-border my-2" />
                  
                  <F29LineItem label="Retención honorarios (cod 151)" value={Number(f29Query.data.retencionHonorarios ?? 0)} />
                  <F29LineItem label="PPM base (cod 563)" value={Number(f29Query.data.ppmBase ?? 0)} />
                  <div className="flex justify-between items-center py-1 text-xs text-muted-foreground bg-background rounded px-2">
                    <span>PPM tasa (cod 115)</span>
                    <span className="font-mono">{(Number(f29Query.data.ppmTasa ?? 0) * 100).toFixed(3)}%</span>
                  </div>
                  <F29LineItem label="PPM monto (cod 62)" value={Number(f29Query.data.ppmMonto ?? 0)} highlight />
                </div>

                {Array.isArray(f29Query.data.fc46Aceptadas) && f29Query.data.fc46Aceptadas.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      FC46 aceptadas en el período ({f29Query.data.fc46Aceptadas.length})
                    </h3>
                    <div className="rounded-xl border border-border overflow-hidden">
                      <EnjTableShell caption="Desliza para ver columnas de FC46">
                        <table className="w-full text-sm">
                          <thead className="bg-surface-sunken text-xs text-muted-foreground">
                            <tr>
                              <th className="text-left px-3 py-2">Folio</th>
                              <th className="text-left px-3 py-2">Proveedor</th>
                              <th className="text-right px-3 py-2">Neto/Exento</th>
                              <th className="text-right px-3 py-2">IVA</th>
                              <th className="text-right px-3 py-2">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {(f29Query.data.fc46Aceptadas as Array<{
                              folio: number;
                              proveedor: string;
                              montoNeto: number;
                              montoExento: number;
                              montoIva: number;
                              montoTotal: number;
                            }>).map((fc) => (
                              <tr key={fc.folio} className="text-foreground">
                                <td className="px-3 py-2 font-mono">{fc.folio}</td>
                                <td className="px-3 py-2 truncate max-w-[140px]">{fc.proveedor}</td>
                                <td className="px-3 py-2 text-right font-mono">
                                  {formatCurrency(fc.montoNeto + fc.montoExento)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono">{formatCurrency(fc.montoIva)}</td>
                                <td className="px-3 py-2 text-right font-mono font-medium">
                                  {formatCurrency(fc.montoTotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </EnjTableShell>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center gap-3">
                  <Button
                    onClick={() => {
                      setF29GuardarAnio(Number(f29Anio));
                      setF29GuardarMes(Number(f29Mes));
                      guardarF29.mutate();
                    }}
                    disabled={guardarF29.isPending}
                  >
                    {guardarF29.isPending ? <HexagonLoader size="sm" className="mr-2" /> : <Save size={16} className="mr-2" />}
                    Guardar F29
                  </Button>
                  {guardarF29.isSuccess && (
                    <span className="text-sm text-primary flex items-center gap-1.5 font-medium bg-primary/10 px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={16} /> Guardada exitosamente
                    </span>
                  )}
                  {guardarF29.isError && <span className="text-sm text-destructive font-medium">{guardarF29.error.message}</span>}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {activeSubTab === "f22" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen size={18} /> Declaración F22 — Anual
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {f22Query.isFetching && f22Query.data ? <LoadingOverlay label="Actualizando F22" /> : null}
            <div className="flex gap-4 mb-6 max-w-xs">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Año comercial</label>
                <input
                  value={f22Anio}
                  onChange={(e) => setF22Anio(e.target.value)}
                  type="number"
                  min="2000"
                  max="2099"
                  className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {f22Query.isLoading ? (
              <ViewLoading variant="view" label="F22" hideLabel />
            ) : f22Query.isError ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-sm">
                {f22Query.error.message}
              </div>
            ) : f22Query.data ? (() => {
              const f22 = f22Query.data;
              const isTransparente = f22.regimen === "pro_pyme_transparente";
              return (
                <div className="animate-in fade-in duration-300 space-y-4">
                  <div className="p-4 bg-surface-sunken rounded-xl text-sm border border-border flex items-center justify-between">
                    <span className="text-muted-foreground">Régimen Tributario</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-bold">{String(f22.regimen ?? "")}</span>
                      {isTransparente && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">Transparencia</span>}
                    </div>
                  </div>

                  <div className="bg-surface-sunken p-5 rounded-xl border border-border space-y-2">
                    {isTransparente && (
                      <>
                        <F29LineItem label="Base imponible transparencia (cod 1609)" value={Number(f22.baseImponibleTransparente ?? 0)} />
                        <F29LineItem label="Atribución al dueño (cod 1610)" value={Number(f22.atribucionDueno ?? 0)} />
                        <div className="border-t border-border my-2" />
                      </>
                    )}

                    <F29LineItem label="PPM total pagado en el año" value={Number(f22.ppmTotalPagado ?? 0)} />
                    <F29LineItem label="PPM crédito personal DJ 1947 (cod 1645)" value={Number(f22.ppmCreditoPersonal ?? 0)} />
                    
                    <div className="border-t border-border my-2" />
                    
                    <F29LineItem label="Retenciones honorarios total (cod 1665)" value={Number(f22.retencionesHonorariosTotal ?? 0)} />
                    <F29LineItem label="IVA débito anual" value={Number(f22.ivaDebitoAnual ?? 0)} />
                    <F29LineItem label="IVA crédito anual" value={Number(f22.ivaCreditoAnual ?? 0)} />
                  </div>
                </div>
              );
            })() : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function F29LineItem({
  label,
  value,
  highlight,
  integer,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  integer?: boolean;
}) {
  const isNegative = value < 0;
  const display = integer
    ? String(Math.round(value))
    : (isNegative ? "-" : "") + formatCurrency(Math.abs(value));

  return (
    <div className={`flex justify-between items-center py-2 ${highlight ? "font-bold text-foreground" : "text-sm text-muted-foreground"}`}>
      <span className={highlight ? "" : "text-muted-foreground"}>{label}</span>
      <span className={`${highlight ? "text-foreground text-base" : "text-foreground font-mono"} ${highlight && value > 0 ? "text-primary" : ""}`}>
        {display}
      </span>
    </div>
  );
}
