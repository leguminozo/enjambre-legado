import React, { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { calcularIVA, calcularTotal } from "@enjambre/contable";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent, Button, HexagonLoader } from "@enjambre/ui";

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
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Crear Factura de Compra (DTE 46)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmitManual} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Folio</label>
              <input value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="Ej: 1" required type="number" className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Monto neto (CLP)</label>
              <input value={montoNeto} onChange={(e) => setMontoNeto(e.target.value)} placeholder="Ej: 10000" required type="number" className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">RUT proveedor</label>
            <input value={receptorRut} onChange={(e) => setReceptorRut(e.target.value)} placeholder="Ej: 76059780-K" required className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Razón social proveedor</label>
            <input value={receptorNombre} onChange={(e) => setReceptorNombre(e.target.value)} placeholder="Ej: Proveedor SPA" required className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Descripción del servicio</label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Opcional" className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Tercero Asociado (opcional UUID)</label>
            <input value={terceroId} onChange={(e) => setTerceroId(e.target.value)} placeholder="Ej: uuid-del-tercero" className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="text-xs text-muted-foreground bg-surface-sunken border border-border rounded-lg p-4 space-y-2 mt-2">
            <div className="flex justify-between">
              <span>Neto:</span>
              <span className="font-mono">{formatCurrency(Number(montoNeto))}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (19%):</span>
              <span className="font-mono">{formatCurrency(calcularIVA(Number(montoNeto)))}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border">
              <span>Total:</span>
              <span className="font-mono text-primary">{formatCurrency(calcularTotal(Number(montoNeto)))}</span>
            </div>
          </div>
          <Button disabled={createManual.isPending} type="submit" className="w-full mt-4">
            {createManual.isPending ? <HexagonLoader size="sm" className="mr-2" /> : <Plus size={16} className="mr-2" />}
            Crear Factura
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
