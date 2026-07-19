import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Send, RefreshCw, DollarSign } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, HexagonLoader, ViewLoading, LoadingOverlay, Button, Badge } from "@enjambre/ui";
import {
  FacturaCompraRow,
  SiiDashboard,
  estadoBadge,
  sourceBadge,
} from "../types";
import { EnjTableShell } from "@/components/layout/EnjTableShell";

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

  const jobsQuery = useQuery({
    queryKey: ["sii", "jobs"],
    queryFn: async () => {
      const res = await apiFetch("/api/sii/jobs?limit=15");
      if (!res.ok) throw new Error("Error cargando cola de emisión");
      return res.json();
    },
    retry: false,
  });

  const emissionSummaryQuery = useQuery({
    queryKey: ["sii", "jobs", "emission-summary"],
    queryFn: async () => {
      const res = await apiFetch("/api/sii/jobs/emission-summary");
      if (!res.ok) throw new Error("Error cargando resumen emisión");
      return res.json();
    },
    retry: false,
  });

  const retryJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiFetch(`/api/sii/jobs/${jobId}/retry`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Error al reintentar job");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii", "jobs"] });
    },
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
  const jobsData = jobsQuery.data?.data as
    | {
        jobs: Array<{
          id: string;
          source_type: string;
          tipo_dte: number;
          status: string;
          attempts: number;
          last_error: string | null;
          scheduled_at: string;
        }>;
        open: { pending: number; failed: number; deadLetter: number };
        autoEmitBoleta: boolean;
        cronConfigured: boolean;
      }
    | undefined;
  const emission = emissionSummaryQuery.data?.data as
    | {
        dtePendientes: number;
        dteEnviadosSinAceptacion: number;
        jobsAbiertos: number;
        autoEmitBoleta: boolean;
        cronConfigured: boolean;
      }
    | undefined;

  return (
    <div className="space-y-6">
      {/* Emisión / cola DTE — go-live */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send size={16} /> Emisión DTE · cola de jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant={emission?.autoEmitBoleta ? "success" : "warning"}>
              auto-boleta: {emission?.autoEmitBoleta ? "ON" : "OFF"}
            </Badge>
            <Badge variant={emission?.cronConfigured ? "success" : "warning"}>
              cron: {emission?.cronConfigured ? "OK" : "sin secret"}
            </Badge>
            <Badge variant="default">
              DTE pendientes: {emission?.dtePendientes ?? "—"}
            </Badge>
            <Badge variant="default">
              enviados sin aceptación: {emission?.dteEnviadosSinAceptacion ?? "—"}
            </Badge>
            <Badge
              variant={
                (jobsData?.open.failed ?? 0) + (jobsData?.open.deadLetter ?? 0) > 0
                  ? "warning"
                  : "default"
              }
            >
              jobs: {jobsData?.open.pending ?? 0}p / {jobsData?.open.failed ?? 0}f /{" "}
              {jobsData?.open.deadLetter ?? 0}dl
            </Badge>
          </div>
          {jobsQuery.isLoading && <ViewLoading variant="inline" label="Jobs" hideLabel />}
          {jobsQuery.isError && (
            <p className="text-sm text-destructive">{(jobsQuery.error as Error).message}</p>
          )}
          {(jobsData?.jobs?.length ?? 0) === 0 && !jobsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Sin jobs recientes en la cola.</p>
          )}
          {(jobsData?.jobs?.length ?? 0) > 0 && (
            <EnjTableShell>
              <table className="w-full data-table text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-2 py-1.5">Tipo</th>
                    <th className="px-2 py-1.5">DTE</th>
                    <th className="px-2 py-1.5">Estado</th>
                    <th className="px-2 py-1.5">Intentos</th>
                    <th className="px-2 py-1.5">Error</th>
                    <th className="px-2 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {jobsData!.jobs.map((j) => (
                    <tr key={j.id} className="border-b border-border/50">
                      <td className="px-2 py-1.5 font-mono text-xs">{j.source_type}</td>
                      <td className="px-2 py-1.5">{j.tipo_dte}</td>
                      <td className="px-2 py-1.5">
                        <Badge
                          variant={
                            j.status === "completed"
                              ? "success"
                              : j.status === "dead_letter" || j.status === "failed"
                                ? "warning"
                                : "default"
                          }
                        >
                          {j.status}
                        </Badge>
                      </td>
                      <td className="px-2 py-1.5">{j.attempts}</td>
                      <td className="px-2 py-1.5 text-xs text-muted-foreground max-w-[12rem] truncate">
                        {j.last_error ?? "—"}
                      </td>
                      <td className="px-2 py-1.5">
                        {["failed", "dead_letter", "pending"].includes(j.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={retryJobMutation.isPending}
                            onClick={() => retryJobMutation.mutate(j.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </EnjTableShell>
          )}
          <p className="text-[11px] text-muted-foreground">
            Auto-boleta y cron se configuran en Vercel (plataforma). CAF/cert en Configuración SII.
            Retry reprograma el job para el próximo tick de <code>/api/cron/fiscal</code>.
          </p>
        </CardContent>
      </Card>

      {dashboardQuery.isLoading ? (
        <ViewLoading variant="view" label="Dashboard SII" hideLabel />
      ) : (
        <div className="stats-grid relative">
          {dashboardQuery.isFetching && dashboardQuery.data ? <LoadingOverlay label="Actualizando resumen" /> : null}
          <StatCard label="Total Compras Neto" value={dash?.totalComprasNeto ?? 0} icon={DollarSign} />
          <StatCard label="Total IVA Compras" value={dash?.totalComprasIva ?? 0} icon={DollarSign} />
          <StatCard label="Total Facturado" value={dash?.totalCompras ?? 0} icon={DollarSign} />
          <StatCard label="Pendientes Enviar SII" value={dash?.pendientesEnvio ?? 0} accent={!!dash?.pendientesEnvio} isCount icon={Send} />
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <FileText size={18} /> Facturas de Compra ({dash?.totalFacturasCompra ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative">
          {facturasQuery.isFetching && (facturasQuery.data?.length ?? 0) > 0 ? (
            <LoadingOverlay label="Actualizando facturas" />
          ) : null}
          <EnjTableShell caption="Desliza para ver columnas de facturas">
            <table className="w-full text-sm text-left data-table">
              <thead className="text-xs text-muted-foreground uppercase bg-surface-sunken">
                <tr>
                  <th className="px-4 py-3">Folio</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Neto</th>
                  <th className="px-4 py-3">IVA</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado SII</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturasQuery.isLoading ? (
                  <tr><td colSpan={9} className="px-4 py-4"><ViewLoading variant="inline" label="Facturas" hideLabel /></td></tr>
                ) : (facturasQuery.data ?? []).length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Sin facturas de compra</td></tr>
                ) : (
                  (facturasQuery.data ?? []).map((f) => (
                    <tr key={f.id} className="border-b border-border last:border-0 hover:bg-surface-sunken/50">
                      <td className="px-4 py-3 font-mono text-muted-foreground">{f.folio}</td>
                      <td className="px-4 py-3 font-medium">{new Date(f.fecha_emision).toLocaleDateString("es-CL")}</td>
                      <td className="px-4 py-3">{f.receptor_razon_social}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatCurrency(f.monto_neto)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatCurrency(f.monto_iva)}</td>
                      <td className="px-4 py-3 font-display text-primary">{formatCurrency(f.monto_total)}</td>
                      <td className="px-4 py-3">{estadoBadge(f.estado_sii)}</td>
                      <td className="px-4 py-3">{sourceBadge(f.source_type)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {f.estado_sii === "pendiente" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => enviarSiiMutation.mutate(f.id)}
                              disabled={enviarSiiMutation.isPending}
                              title="Enviar al SII"
                            >
                              {enviarSiiMutation.isPending ? <HexagonLoader size="sm" className="mr-1" /> : <Send size={12} className="mr-1" />}
                              Enviar
                            </Button>
                          )}
                          {f.estado_sii === "enviado" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pollSiiMutation.mutate(f.id)}
                              disabled={pollSiiMutation.isPending}
                              title="Consultar estado SII"
                            >
                              {pollSiiMutation.isPending ? <HexagonLoader size="sm" className="mr-1" /> : <RefreshCw size={12} className="mr-1" />}
                              Poll
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </EnjTableShell>
        </CardContent>
      </Card>
      {dashboardQuery.isError && <p className="text-sm text-destructive">{dashboardQuery.error.message}</p>}
    </div>
  );
}

function StatCard({ label, value, accent, isCount, icon: Icon }: { label: string; value: number; accent?: boolean; isCount?: boolean; icon?: any }) {
  const isNegative = value < 0;
  return (
    <Card className="bg-surface-sunken border-border">
      <CardContent className="p-6 flex items-center gap-4">
        {Icon && (
          <div className={`p-3 rounded-xl ${accent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            <Icon size={24} />
          </div>
        )}
        <div>
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">{label}</div>
          <div className={`text-2xl font-display ${accent === true ? "text-destructive" : accent === false ? "text-destructive" : "text-foreground"}`}>
            {isCount ? value : (isNegative ? "-" : "") + formatCurrency(Math.abs(value))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
