import React, { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt, Loader2, CheckCircle2 } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatCurrency } from "@/lib/format";
import { GastoParseado, ProveedorInfo } from "../types";

export function GastoExtranjeroTab() {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();

  const [receiptText, setReceiptText] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [gastoParseado, setGastoParseado] = useState<GastoParseado | null>(null);

  const proveedoresQuery = useQuery({
    queryKey: ["sii", "proveedores"],
    queryFn: async (): Promise<ProveedorInfo[]> => {
      const res = await apiFetch("/api/sii/gastos-extranjero/proveedores");
      if (!res.ok) throw new Error("Error cargando proveedores");
      const json = await res.json();
      return json.data ?? [];
    },
    retry: false,
  });

  const parseGasto = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/sii/gastos-extranjero/parse", {
        method: "POST",
        body: JSON.stringify({
          receipt_text: receiptText,
          proveedor_id: proveedorId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error parseando recibo");
      }
      const json = await res.json();
      return json;
    },
    onSuccess: (result) => {
      setGastoParseado(result.data);
    },
  });

  const facturarGasto = useMutation({
    mutationFn: async () => {
      if (!gastoParseado) throw new Error("No hay gasto parseado");

      const res = await apiFetch("/api/sii/gastos-extranjero/facturar", {
        method: "POST",
        body: JSON.stringify({ gasto: gastoParseado }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error creando factura");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
      setReceiptText("");
      setGastoParseado(null);
    },
  });

  const onSubmitParse = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    parseGasto.mutate();
  };

  const proveedores = proveedoresQuery.data ?? [];

  return (
    <section className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-display text-lg mb-2 flex items-center gap-2 text-foreground">
        <Receipt size={18} /> Recibo → Factura de Compra
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Pega el texto de cualquier recibo (Uber, Google Ads, Meta, Hostinger, AWS, Shopify, Stripe).
        El sistema detecta el proveedor, convierte moneda, y genera la Factura de Compra tipo 46.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {proveedoresQuery.isLoading ? (
          <Loader2 className="animate-spin text-muted-foreground" size={16} />
        ) : (
          proveedores.map((p) => (
            <button
              key={p.id}
              onClick={() => setProveedorId(proveedorId === p.id ? "" : p.id)}
              className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                proveedorId === p.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-accent/50"
              }`}
            >
              {p.nombre}
            </button>
          ))
        )}
      </div>

      {!gastoParseado ? (
        <form onSubmit={onSubmitParse} className="grid gap-4 max-w-lg">
          <textarea
            value={receiptText}
            onChange={(e) => setReceiptText(e.target.value)}
            placeholder="Pega aquí el texto del recibo, invoice, o billing statement..."
            rows={8}
            required
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono resize-y text-foreground"
          />
          <button
            type="submit"
            disabled={parseGasto.isPending}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {parseGasto.isPending ? <Loader2 className="animate-spin mx-auto text-accent-foreground" size={18} /> : "Analizar recibo"}
          </button>
          {parseGasto.isError && <p className="text-sm text-destructive">{parseGasto.error.message}</p>}
        </form>
      ) : (
        <div className="grid gap-4 max-w-lg">
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm border border-border">
            <div className="flex items-center gap-2 text-accent font-bold">
              <CheckCircle2 size={16} /> {gastoParseado.proveedorNombre}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
              <span>RUT:</span><span className="text-foreground font-mono">{gastoParseado.proveedorRut}</span>
              <span>Giro:</span><span className="text-foreground">{gastoParseado.proveedorGiro}</span>
              <span>Concepto:</span><span className="text-foreground">{gastoParseado.concepto}</span>
              <span>Fecha:</span><span className="text-foreground">{gastoParseado.fechaEmision}</span>
              {gastoParseado.numeroDocumento && (
                <><span>Documento:</span><span className="text-foreground font-mono">{gastoParseado.numeroDocumento}</span></>
              )}
            </div>
            <div className="border-t border-border pt-2 mt-2 space-y-1">
              {gastoParseado.monedaOriginal !== "CLP" && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Monto original:</span>
                    <span className="text-foreground font-mono">{gastoParseado.monedaOriginal} {gastoParseado.montoOriginal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tasa de cambio:</span>
                    <span className="text-foreground font-mono">${gastoParseado.tasaCambio.toLocaleString("es-CL")}/USD</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Monto CLP:</span>
                <span className="font-bold text-foreground font-mono">{formatCurrency(gastoParseado.montoCLP)}</span>
              </div>
              {gastoParseado.montoExento > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Exento (sin IVA):</span>
                  <span className="text-foreground font-mono">{formatCurrency(gastoParseado.montoExento)}</span>
                </div>
              )}
              {gastoParseado.montoNeto > 0 && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Neto:</span>
                    <span className="text-foreground font-mono">{formatCurrency(gastoParseado.montoNeto)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>IVA (19%):</span>
                    <span className="text-foreground font-mono">{formatCurrency(gastoParseado.montoIva)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-foreground border-t border-border pt-1">
                <span>Total:</span>
                <span className="font-mono">{formatCurrency(gastoParseado.montoTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => facturarGasto.mutate()}
              disabled={facturarGasto.isPending}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {facturarGasto.isPending ? <Loader2 className="animate-spin mx-auto text-accent-foreground" size={18} /> : "Emitir Factura de Compra"}
            </button>
            <button
              onClick={() => { setGastoParseado(null); setReceiptText(""); }}
              className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground bg-secondary/30 transition-colors"
            >
              Volver
            </button>
          </div>
          {facturarGasto.isError && <p className="text-sm text-destructive">{facturarGasto.error.message}</p>}
        </div>
      )}
    </section>
  );
}
