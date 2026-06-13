import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Send, RefreshCw, DollarSign } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatCurrency } from "@/lib/format";
import {
  FacturaCompraRow,
  SiiDashboard,
  estadoBadge,
  sourceBadge,
} from "../types";

export function DashboardTab() {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();

  const dashboardQuery = useQuery({
    queryKey: ["sii", "dashboard"],
    queryFn: async (): Promise<SiiDashboard> => {
      const res = await apiFetch("/api/sii/dashboard");
      if (!res.ok) throw new Error("Error cargando dashboard SII");
      const json = await res.json();
      return json.data;
    },
    retry: false,
  });

  const facturasQuery = useQuery({
    queryKey: ["sii", "facturas-compra"],
    queryFn: async (): Promise<FacturaCompraRow[]> => {
      const res = await apiFetch("/api/sii/facturas-compra");
      if (!res.ok) throw new Error("Error cargando facturas de compra");
      const json = await res.json();
      return json.data ?? [];
    },
    retry: false,
  });

  const enviarSiiMutation = useMutation({
    mutationFn: async (facturaId: string) => {
      const res = await apiFetch(`/api/sii/facturas-compra/${facturaId}/enviar-sii`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error enviando al SII");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
    },
  });

  const pollSiiMutation = useMutation({
    mutationFn: async (facturaId: string) => {
      const res = await apiFetch(`/api/sii/facturas-compra/${facturaId}/poll-sii`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error consultando estado SII");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
    },
  });

  const dash = dashboardQuery.data;

  return (
    <div className="space-y-6">
      {dashboardQuery.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-accent" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Compras Neto" value={dash?.totalComprasNeto ?? 0} />
          <StatCard label="Total IVA Compras" value={dash?.totalComprasIva ?? 0} />
          <StatCard label="Total Facturado" value={dash?.totalCompras ?? 0} />
          <StatCard label="Pendientes Enviar SII" value={dash?.pendientesEnvio ?? 0} accent={!!dash?.pendientesEnvio} isCount />
        </div>
      )}

      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-display text-lg flex items-center gap-2">
            <FileText size={18} /> Facturas de Compra ({dash?.totalFacturasCompra ?? 0})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Folio</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Neto</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">IVA</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Estado SII</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Origen</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturasQuery.isLoading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
              ) : (facturasQuery.data ?? []).length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Sin facturas de compra</td></tr>
              ) : (
                (facturasQuery.data ?? []).map((f) => (
                  <tr key={f.id} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="px-4 py-3 text-sm font-mono">{f.folio}</td>
                    <td className="px-4 py-3 text-sm">{new Date(f.fecha_emision).toLocaleDateString("es-CL")}</td>
                    <td className="px-4 py-3 text-sm">{f.receptor_razon_social}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(f.monto_neto)}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(f.monto_iva)}</td>
                    <td className="px-4 py-3 text-sm font-bold">{formatCurrency(f.monto_total)}</td>
                    <td className="px-4 py-3">{estadoBadge(f.estado_sii)}</td>
                    <td className="px-4 py-3 text-sm">{sourceBadge(f.source_type)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {f.estado_sii === "pendiente" && (
                          <button
                            onClick={() => enviarSiiMutation.mutate(f.id)}
                            disabled={enviarSiiMutation.isPending}
                            className="px-2 py-1 text-xs rounded border border-accent/50 text-accent hover:bg-accent/10 disabled:opacity-50 flex items-center gap-1"
                            title="Enviar al SII"
                          >
                            <Send size={12} /> Enviar
                          </button>
                        )}
                        {f.estado_sii === "enviado" && (
                          <button
                            onClick={() => pollSiiMutation.mutate(f.id)}
                            disabled={pollSiiMutation.isPending}
                            className="px-2 py-1 text-xs rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-50 flex items-center gap-1"
                            title="Consultar estado SII"
                          >
                            <RefreshCw size={12} /> Poll
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      {dashboardQuery.isError && <p className="text-sm text-destructive">{dashboardQuery.error.message}</p>}
    </div>
  );
}

function StatCard({ label, value, accent, isCount }: { label: string; value: number; accent?: boolean; isCount?: boolean }) {
  const isNegative = value < 0;
  return (
    <div className="p-5 rounded-2xl bg-card border border-border">
      <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-display ${accent === true ? "text-accent" : accent === false ? "text-destructive" : ""}`}>
        {isCount ? value : (isNegative ? "-" : "") + formatCurrency(Math.abs(value))}
      </div>
    </div>
  );
}
