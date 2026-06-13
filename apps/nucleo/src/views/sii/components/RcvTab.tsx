import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Loader2, CheckCircle2, Clock } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatCurrency } from "@/lib/format";
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

  return (
    <section className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-display text-lg mb-4 flex items-center gap-2 text-foreground">
        <RefreshCw size={18} /> RCV — Registro de Compras y Ventas
      </h3>

      <div className="flex gap-3 mb-4 items-end">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Periodo (YYYYMM)</label>
          <input
            value={rcvPeriodo}
            onChange={(e) => setRcvPeriodo(e.target.value)}
            placeholder="202606"
            maxLength={6}
            className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-28 text-foreground font-mono"
          />
        </div>
        <button
          onClick={() => rcvSync.mutate()}
          disabled={rcvSync.isPending}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2"
        >
          {rcvSync.isPending ? <Loader2 className="animate-spin text-accent-foreground" size={16} /> : <RefreshCw size={14} />} Sincronizar SII
        </button>
        {rcvSync.isError && <span className="text-sm text-destructive">{rcvSync.error.message}</span>}
        {rcvSync.isSuccess && (
          <span className="text-sm text-primary flex items-center gap-1">
            <CheckCircle2 size={14} /> Sincronizado
          </span>
        )}
      </div>

      {rcvQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-accent" size={24} />
        </div>
      ) : rcvQuery.isError ? (
        <p className="text-sm text-destructive">{rcvQuery.error.message}</p>
      ) : (() => {
        const rcvData = rcvQuery.data;
        if (!rcvData) return null;

        if (rcvData.sync) {
          const s = rcvData.sync;
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-secondary/50 rounded-lg text-sm border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Documentos</div>
                  <div className="text-foreground font-bold font-mono">{s.total_documentos}</div>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg text-sm border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Total neto</div>
                  <div className="text-foreground font-bold font-mono">{formatCurrency(s.total_neto)}</div>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg text-sm border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Total IVA</div>
                  <div className="text-foreground font-bold font-mono">{formatCurrency(s.total_iva)}</div>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg text-sm border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Último sync</div>
                  <div className="text-foreground text-xs font-mono">
                    {new Date(s.ultimo_sync).toLocaleString("es-CL")}
                  </div>
                </div>
              </div>

              {(rcvData.registros ?? []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground">Tipo</th>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground">Folio</th>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground">Fecha</th>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground">RUT</th>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground">Neto</th>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground">IVA</th>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground">Total</th>
                        <th className="px-3 py-2 text-left text-xs text-muted-foreground">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rcvData.registros.map((r) => (
                        <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/50">
                          <td className="px-3 py-2 text-sm text-foreground">{r.tipo_dte}</td>
                          <td className="px-3 py-2 text-sm font-mono text-foreground">{r.folio}</td>
                          <td className="px-3 py-2 text-sm text-foreground">
                            {new Date(r.fecha_emision).toLocaleDateString("es-CL")}
                          </td>
                          <td className="px-3 py-2 text-sm font-mono text-foreground">{r.rut_contraparte}</td>
                          <td className="px-3 py-2 text-sm font-mono text-foreground">{formatCurrency(r.monto_neto)}</td>
                          <td className="px-3 py-2 text-sm font-mono text-foreground">{formatCurrency(r.monto_iva)}</td>
                          <td className="px-3 py-2 text-sm font-mono font-bold text-foreground">
                            {formatCurrency(r.monto_total)}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                                r.reconciliado
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : "bg-surface-raised text-muted-foreground border-border"
                              }`}
                            >
                              {r.reconciliado ? <CheckCircle2 size={12} /> : <Clock size={12} />} {r.estado_rcv}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin registros en este periodo</p>
              )}
            </div>
          );
        }

        return (
          <p className="text-sm text-muted-foreground">
            Sin datos RCV para el periodo {rcvPeriodo}. Presiona Sincronizar SII para obtener del SII.
          </p>
        );
      })()}
    </section>
  );
}
