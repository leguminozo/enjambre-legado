import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Loader2, CheckCircle2 } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatCurrency } from "@/lib/format";
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
    <section className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-display text-lg mb-4 flex items-center gap-2 text-foreground">
        <Users size={18} /> Honorarios — Retención 15.25%
      </h3>

      <div className="bg-secondary/50 rounded-lg p-4 mb-6 max-w-lg border border-border">
        <h4 className="text-sm font-bold text-foreground mb-3 font-display">Registrar honorario</h4>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fecha</label>
              <input
                value={honorarioFecha}
                onChange={(e) => setHonorarioFecha(e.target.value)}
                type="date"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Monto bruto (CLP)</label>
              <input
                value={honorarioMonto}
                onChange={(e) => setHonorarioMonto(e.target.value)}
                type="number"
                placeholder="Ej: 500000"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
            <input
              value={honorarioDescripcion}
              onChange={(e) => setHonorarioDescripcion(e.target.value)}
              placeholder="Ej: Servicios contables"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>
          {honorarioMonto && Number(honorarioMonto) > 0 && (
            <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3 space-y-1 border border-border/50">
              <div>Bruto: {formatCurrency(Number(honorarioMonto))}</div>
              <div>Retención (15.25%): {formatCurrency(Math.round(Number(honorarioMonto) * 0.1525))}</div>
              <div className="font-bold text-foreground">
                Neto prestador: {formatCurrency(Number(honorarioMonto) - Math.round(Number(honorarioMonto) * 0.1525))}
              </div>
            </div>
          )}
          <button
            onClick={() => createHonorario.mutate()}
            disabled={createHonorario.isPending || !honorarioMonto || !honorarioDescripcion}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {createHonorario.isPending ? <Loader2 className="animate-spin mx-auto text-accent-foreground" size={18} /> : "Registrar honorario"}
          </button>
          {createHonorario.isError && <p className="text-sm text-destructive">{createHonorario.error.message}</p>}
          {createHonorario.isSuccess && (
            <p className="text-sm text-primary flex items-center gap-1">
              <CheckCircle2 size={14} /> Registrado
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-bold text-foreground mb-3 font-display">Historial</h4>
        {honorariosQuery.isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-accent" size={20} />
          </div>
        ) : (honorariosQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin honorarios registrados</p>
        ) : (
          <div className="space-y-2">
            {(honorariosQuery.data ?? []).map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg text-sm border border-border/50"
              >
                <div>
                  <span className="text-foreground font-semibold">{h.descripcion}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(h.fecha).toLocaleDateString("es-CL")}
                  </span>
                  {h.tercero && <span className="text-muted-foreground ml-2">({h.tercero.nombre})</span>}
                </div>
                <div className="text-right">
                  <div className="text-foreground font-mono font-bold">{formatCurrency(h.monto_bruto)}</div>
                  <div className="text-xs text-destructive font-mono">Ret: {formatCurrency(h.monto_retencion)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
