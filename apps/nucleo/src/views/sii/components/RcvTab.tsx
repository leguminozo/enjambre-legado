import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatCurrency, formatCalendarDate } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent, Button, HexagonLoader, ViewLoading, LoadingOverlay, DataTable, SkeletonKpi, SkeletonTable, type ColumnDef } from "@enjambre/ui";
import { RcvSyncRow, RcvRegistroRow } from "../types";

export function RcvTab() {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();

  const [rcvPeriodo, setRcvPeriodo] = useState(
    `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );

  const rcvQuery = useQuery({
    queryKey: ["sii", "rcv", rcvPeriodo],
    queryFn: async () => {
      const res = await apiFetch(`/api/sii/rcv/${rcvPeriodo}?tipo=compras`);
      if (!res.ok) throw new Error("Error cargando RCV");
      const json = await res.json();
      return json.data as { sync: RcvSyncRow | null; registros: RcvRegistroRow[] };
    },
    retry: false,
  });

  const rcvSync = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/sii/rcv/${rcvPeriodo}/sync?tipo=compras`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error sincronizando RCV");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii", "rcv", rcvPeriodo] });
    },
  });

  // Columnas adaptativas: RUT/Neto/IVA se ocultan solas en espacio angosto
  const rcvColumns = useMemo<ColumnDef<RcvRegistroRow>[]>(
    () => [
      { key: "tipo_dte", header: "Tipo", sortable: true, render: (r) => String(r.tipo_dte), csvValue: (r) => String(r.tipo_dte) },
      { key: "folio", header: "Folio", sortable: true, render: (r) => <span className="font-mono">{r.folio}</span>, csvValue: (r) => String(r.folio) },
      { key: "fecha_emision", header: "Fecha", sortable: true, render: (r) => formatCalendarDate(r.fecha_emision), csvValue: (r) => r.fecha_emision },
      { key: "rut_contraparte", header: "RUT", sortable: true, hideBelow: 420, render: (r) => <span className="font-mono">{r.rut_contraparte}</span>, csvValue: (r) => r.rut_contraparte },
      { key: "monto_neto", header: "Neto", sortable: true, align: "right", hideBelow: 560, render: (r) => <span className="font-mono">{formatCurrency(r.monto_neto)}</span>, csvValue: (r) => String(r.monto_neto) },
      { key: "monto_iva", header: "IVA", sortable: true, align: "right", hideBelow: 480, render: (r) => <span className="font-mono">{formatCurrency(r.monto_iva)}</span>, csvValue: (r) => String(r.monto_iva) },
      { key: "monto_total", header: "Total", sortable: true, align: "right", render: (r) => <span className="font-mono font-bold">{formatCurrency(r.monto_total)}</span>, csvValue: (r) => String(r.monto_total) },
      {
        key: "estado_rcv",
        header: "Estado",
        align: "center",
        render: (r) => (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              r.reconciliado
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-surface-sunken text-muted-foreground border-border"
            }`}
          >
            {r.reconciliado ? <CheckCircle2 size={14} /> : <Clock size={14} />} {r.estado_rcv}
          </span>
        ),
        csvValue: (r) => r.estado_rcv,
      },
    ],
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw size={18} /> RCV — Registro de Compras y Ventas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 items-end bg-surface-sunken p-4 rounded-xl border border-border">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Periodo (YYYYMM)</label>
            <input
              value={rcvPeriodo}
              onChange={(e) => setRcvPeriodo(e.target.value)}
              placeholder="202606"
              maxLength={6}
              className="w-32 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button
            onClick={() => rcvSync.mutate()}
            disabled={rcvSync.isPending}
          >
            {rcvSync.isPending ? <HexagonLoader size="sm" className="mr-2" /> : <RefreshCw size={16} className="mr-2" />}
            Sincronizar SII
          </Button>
          {rcvSync.isError && <span className="text-sm text-destructive font-medium">{rcvSync.error.message}</span>}
          {rcvSync.isSuccess && (
            <span className="text-sm text-primary flex items-center gap-1.5 font-medium bg-primary/10 px-3 py-1.5 rounded-full">
              <CheckCircle2 size={16} /> Sincronizado
            </span>
          )}
        </div>

        <div className="relative">
          {rcvQuery.isFetching && rcvQuery.data ? <LoadingOverlay label="Actualizando RCV" /> : null}
        {rcvQuery.isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SkeletonKpi />
              <SkeletonKpi />
              <SkeletonKpi />
              <SkeletonKpi />
            </div>
            <SkeletonTable rows={5} columns={6} />
          </div>
        ) : rcvQuery.isError ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-sm">
            {rcvQuery.error.message}
          </div>
        ) : (() => {
          const rcvData = rcvQuery.data;
          if (!rcvData) return null;

          if (rcvData.sync) {
            const s = rcvData.sync;
            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-surface-sunken rounded-xl text-sm border border-border flex flex-col justify-center">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Documentos</div>
                    <div className="text-foreground font-bold font-mono text-xl">{s.total_documentos}</div>
                  </div>
                  <div className="p-4 bg-surface-sunken rounded-xl text-sm border border-border flex flex-col justify-center">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Total neto</div>
                    <div className="text-foreground font-bold font-mono text-lg">{formatCurrency(s.total_neto)}</div>
                  </div>
                  <div className="p-4 bg-surface-sunken rounded-xl text-sm border border-border flex flex-col justify-center">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Total IVA</div>
                    <div className="text-foreground font-bold font-mono text-lg">{formatCurrency(s.total_iva)}</div>
                  </div>
                  <div className="p-4 bg-surface-sunken rounded-xl text-sm border border-border flex flex-col justify-center">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Último sync</div>
                    <div className="text-foreground text-xs font-mono">
                      {new Date(s.ultimo_sync).toLocaleString("es-CL")}
                    </div>
                  </div>
                </div>

                {(rcvData.registros ?? []).length > 0 ? (
                  <DataTable<RcvRegistroRow>
                    columns={rcvColumns}
                    rows={rcvData.registros}
                    getId={(r) => r.id}
                    sortable
                    exportable
                    columnsControl
                    storageKey="sii-rcv"
                    fullscreen
                    fullscreenLabel={`RCV compras ${rcvPeriodo}`}
                    exportFilename={`sii-rcv-${rcvPeriodo}`}
                    emptyState="No se registran documentos de compras o ventas para este periodo tributario"
                  />
                ) : (
                  <div className="py-8 text-center bg-surface-sunken rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground">No se registran documentos de compras o ventas para este periodo tributario</p>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div className="py-8 text-center bg-surface-sunken rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">
                Sin datos RCV para el periodo <span className="font-mono font-bold">{rcvPeriodo}</span>.<br />
                Presiona Sincronizar SII para obtener del SII.
              </p>
            </div>
          );
        })()}
        </div>
      </CardContent>
    </Card>
  );
}
