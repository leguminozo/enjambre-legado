import React, { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { calcularIVA, calcularTotal } from "@enjambre/contable";
import { formatCurrency } from "@/lib/format";

interface FacturaCompraFormProps {
  onComplete: () => void;
}

export function FacturaCompraForm({ onComplete }: FacturaCompraFormProps) {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();

  const [folio, setFolio] = useState("");
  const [terceroId, setTerceroId] = useState("");
  const [montoNeto, setMontoNeto] = useState("");
  const [receptorRut, setReceptorRut] = useState("");
  const [receptorNombre, setReceptorNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const createManual = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/sii/facturas-compra", {
        method: "POST",
        body: JSON.stringify({
          tercero_id: terceroId || undefined,
          folio: Number(folio),
          fecha_emision: new Date().toISOString(),
          monto_neto: Number(montoNeto),
          receptor_rut: receptorRut,
          receptor_razon_social: receptorNombre,
          descripcion: descripcion || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error creando factura de compra");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
      setFolio("");
      setMontoNeto("");
      setDescripcion("");
      setReceptorRut("");
      setReceptorNombre("");
      onComplete();
    },
  });

  const onSubmitManual = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createManual.mutate();
  };

  return (
    <section className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-display text-lg mb-4">Crear Factura de Compra (DTE 46)</h3>
      <form onSubmit={onSubmitManual} className="grid gap-4 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Folio</label>
            <input value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="Ej: 1" required type="number" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Monto neto (CLP)</label>
            <input value={montoNeto} onChange={(e) => setMontoNeto(e.target.value)} placeholder="Ej: 10000" required type="number" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">RUT proveedor</label>
          <input value={receptorRut} onChange={(e) => setReceptorRut(e.target.value)} placeholder="Ej: 76059780-K" required className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Razón social proveedor</label>
          <input value={receptorNombre} onChange={(e) => setReceptorNombre(e.target.value)} placeholder="Ej: Google Chile Ltda" required className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Descripción del servicio</label>
          <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Google Ads de Mayo 2026" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tercero Asociado (opcional)</label>
          <input value={terceroId} onChange={(e) => setTerceroId(e.target.value)} placeholder="Ej: uuid-del-tercero" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3 space-y-1">
          <div>Neto: {formatCurrency(Number(montoNeto))}</div>
          <div>IVA (19%): {formatCurrency(calcularIVA(Number(montoNeto)))}</div>
          <div className="font-bold text-foreground">Total: {formatCurrency(calcularTotal(Number(montoNeto)))}</div>
        </div>
        <button disabled={createManual.isPending} type="submit" className="btn btn-primary flex items-center justify-center gap-2 py-2 text-sm mt-2">
          {createManual.isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Crear Factura
        </button>
      </form>
    </section>
  );
}
