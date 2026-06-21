import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, CheckCircle2 } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner } from "@enjambre/ui";
import { HonorarioRow } from "../types";

export function HonorariosTab() {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();

  const [honorarioFecha, setHonorarioFecha] = useState(new Date().toISOString().slice(0, 10));
  const [honorarioMonto, setHonorarioMonto] = useState("");
  const [honorarioDescripcion, setHonorarioDescripcion] = useState("");

  const honorariosQuery = useQuery({
    queryKey: ["sii", "honorarios"],
    queryFn: async () => {
      const res = await apiFetch("/api/sii/honorarios");
      if (!res.ok) throw new Error("Error cargando honorarios");
      const json = await res.json();
      return json.data as HonorarioRow[];
    },
    retry: false,
  });

  const createHonorario = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/sii/honorarios", {
        method: "POST",
        body: JSON.stringify({
          fecha: honorarioFecha,
          monto_bruto: Number(honorarioMonto),
          descripcion: honorarioDescripcion,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error creando honorario");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
      setHonorarioMonto("");
      setHonorarioDescripcion("");
    },
  });

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={18} /> Honorarios — Retención 15.25%
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-surface-sunken rounded-xl p-5 border border-border">
          <h4 className="text-sm font-bold text-foreground mb-4 font-display">Registrar honorario</h4>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Fecha</label>
                <input
                  value={honorarioFecha}
                  onChange={(e) => setHonorarioFecha(e.target.value)}
                  type="date"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Monto bruto (CLP)</label>
                <input
                  value={honorarioMonto}
                  onChange={(e) => setHonorarioMonto(e.target.value)}
                  type="number"
                  placeholder="Ej: 500000"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Descripción</label>
              <input
                value={honorarioDescripcion}
                onChange={(e) => setHonorarioDescripcion(e.target.value)}
                placeholder="Ej: Servicios contables"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {honorarioMonto && Number(honorarioMonto) > 0 && (
              <div className="text-xs text-muted-foreground bg-background rounded-lg p-3 space-y-1 border border-border">
                <div className="flex justify-between">
                  <span>Bruto:</span>
                  <span className="font-mono">{formatCurrency(Number(honorarioMonto))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Retención (15.25%):</span>
                  <span className="font-mono text-destructive">{formatCurrency(Math.round(Number(honorarioMonto) * 0.1525))}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 mt-1">
                  <span>Neto prestador:</span>
                  <span className="font-mono text-primary">{formatCurrency(Number(honorarioMonto) - Math.round(Number(honorarioMonto) * 0.1525))}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mt-2">
              <Button
                onClick={() => createHonorario.mutate()}
                disabled={createHonorario.isPending || !honorarioMonto || !honorarioDescripcion}
              >
                {createHonorario.isPending ? <Spinner className="w-4 h-4 mr-2" /> : null} 
                Registrar honorario
              </Button>
              {createHonorario.isError && <p className="text-sm text-destructive">{createHonorario.error.message}</p>}
              {createHonorario.isSuccess && (
                <p className="text-sm text-primary flex items-center gap-1">
                  <CheckCircle2 size={14} /> Registrado
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h4 className="text-sm font-bold text-foreground mb-4 font-display">Historial de Honorarios</h4>
          {honorariosQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="w-6 h-6 text-primary" />
            </div>
          ) : (honorariosQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 bg-surface-sunken rounded-lg border border-border">Sin honorarios registrados</p>
          ) : (
            <div className="space-y-2">
              {(honorariosQuery.data ?? []).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-4 bg-surface-sunken rounded-xl text-sm border border-border hover:border-border/80 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-foreground font-semibold">{h.descripcion}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(h.fecha).toLocaleDateString("es-CL")}
                      {h.tercero && <span className="ml-1 opacity-70">· {h.tercero.nombre}</span>}
                      {h.incentivo_ledger_id && (
                        <span className="ml-1 text-accent opacity-90">· desde ledger feria</span>
                      )}
                    </span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="text-foreground font-mono font-bold text-base">{formatCurrency(h.monto_bruto)}</div>
                    <div className="text-xs text-destructive font-mono mt-0.5 bg-destructive/10 px-2 py-0.5 rounded text-destructive/90">Ret: {formatCurrency(h.monto_retencion)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
