import React, { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt, CheckCircle2, Send } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner } from "@enjambre/ui";
import { GastoParseado, ProveedorInfo } from "../types";

type ProcesarResult = {
  ok: true;
  alreadyProcessed: boolean;
  gastoId: string;
  facturaCompraId: string;
  idempotencyKey: string;
  emission?: { trackId: string; estadoSii: string };
  rcv?: { periodo: string; reconciledCount: number };
  warnings?: string[];
};

export function GastoExtranjeroTab() {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();

  const [receiptText, setReceiptText] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [gastoParseado, setGastoParseado] = useState<GastoParseado | null>(null);
  const [procesarResult, setProcesarResult] = useState<ProcesarResult | null>(null);

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
      setProcesarResult(null);
    },
  });

  const procesarGasto = useMutation({
    mutationFn: async () => {
      if (!gastoParseado) throw new Error("No hay gasto parseado");

      const res = await apiFetch("/api/sii/gastos-extranjero/procesar", {
        method: "POST",
        body: JSON.stringify({
          gasto: gastoParseado,
          receipt_raw: receiptText,
          emit_to_sii: true,
          sync_rcv: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message ?? "Error procesando gasto");
      }
      return json.data as ProcesarResult;
    },
    onSuccess: (result) => {
      setProcesarResult(result);
      queryClient.invalidateQueries({ queryKey: ["sii"] });
    },
  });

  const onSubmitParse = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    parseGasto.mutate();
  };

  const resetForm = () => {
    setReceiptText("");
    setGastoParseado(null);
    setProcesarResult(null);
  };

  const proveedores = proveedoresQuery.data ?? [];

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt size={18} /> Recibo → Factura de Compra → SII
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Pega el texto de cualquier recibo (Uber, Google Ads, Meta, Hostinger, AWS, Shopify, Stripe).
          El sistema detecta el proveedor, genera la Factura de Compra tipo 46 y la envía al SII.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-6">
          {proveedoresQuery.isLoading ? (
            <Spinner className="w-4 h-4 text-muted-foreground" />
          ) : (
            proveedores.map((p) => (
              <button
                key={p.id}
                onClick={() => setProveedorId(proveedorId === p.id ? "" : p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  proveedorId === p.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface-sunken text-muted-foreground hover:border-primary/50"
                }`}
              >
                {p.nombre}
              </button>
            ))
          )}
        </div>

        {procesarResult ? (
          <div className="grid gap-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-primary font-bold">
                <CheckCircle2 size={18} />
                {procesarResult.alreadyProcessed ? "Gasto ya procesado" : "Pipeline completado"}
              </div>
              <div className="grid gap-1 text-muted-foreground font-mono text-xs">
                <div>Gasto: {procesarResult.gastoId}</div>
                <div>Factura compra: {procesarResult.facturaCompraId}</div>
                {procesarResult.emission && (
                  <>
                    <div>Track SII: {procesarResult.emission.trackId}</div>
                    <div>Estado SII: {procesarResult.emission.estadoSii}</div>
                  </>
                )}
                {procesarResult.rcv && (
                  <div>RCV {procesarResult.rcv.periodo}: {procesarResult.rcv.reconciledCount} reconciliados</div>
                )}
              </div>
              {procesarResult.warnings?.map((w) => (
                <p key={w} className="text-xs text-amber-600 dark:text-amber-400">{w}</p>
              ))}
            </div>
            <Button variant="outline" onClick={resetForm}>Procesar otro recibo</Button>
          </div>
        ) : !gastoParseado ? (
          <form onSubmit={onSubmitParse} className="grid gap-4">
            <textarea
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
              placeholder="Pega aquí el texto del recibo, invoice, o billing statement..."
              rows={8}
              required
              className="w-full bg-surface-sunken border border-border rounded-lg px-4 py-3 text-sm font-mono resize-y text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              type="submit"
              disabled={parseGasto.isPending}
              className="w-full sm:w-auto sm:justify-self-start"
            >
              {parseGasto.isPending ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Analizar recibo
            </Button>
            {parseGasto.isError && <p className="text-sm text-destructive">{parseGasto.error.message}</p>}
          </form>
        ) : (
          <div className="grid gap-6">
            <div className="bg-surface-sunken rounded-lg p-5 space-y-3 text-sm border border-border">
              <div className="flex items-center gap-2 text-primary font-bold text-lg">
                <CheckCircle2 size={18} /> {gastoParseado.proveedorNombre}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground">
                <div className="flex flex-col"><span className="text-xs uppercase">RUT</span><span className="text-foreground font-mono">{gastoParseado.proveedorRut}</span></div>
                <div className="flex flex-col"><span className="text-xs uppercase">Giro</span><span className="text-foreground">{gastoParseado.proveedorGiro}</span></div>
                <div className="flex flex-col"><span className="text-xs uppercase">Concepto</span><span className="text-foreground">{gastoParseado.concepto}</span></div>
                <div className="flex flex-col"><span className="text-xs uppercase">Fecha</span><span className="text-foreground">{gastoParseado.fechaEmision}</span></div>
                {gastoParseado.numeroDocumento && (
                  <div className="flex flex-col"><span className="text-xs uppercase">Documento</span><span className="text-foreground font-mono">{gastoParseado.numeroDocumento}</span></div>
                )}
              </div>
              <div className="border-t border-border pt-4 mt-2 space-y-2">
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
                <div className="flex justify-between font-bold text-lg text-foreground border-t border-border pt-2 mt-2">
                  <span>Total a Facturar:</span>
                  <span className="font-mono text-primary">{formatCurrency(gastoParseado.montoTotal)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => procesarGasto.mutate()}
                disabled={procesarGasto.isPending}
              >
                {procesarGasto.isPending ? <Spinner className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Procesar y enviar al SII
              </Button>
              <Button
                variant="outline"
                onClick={() => { setGastoParseado(null); setReceiptText(""); }}
              >
                Cancelar y Volver
              </Button>
            </div>
            {procesarGasto.isError && <p className="text-sm text-destructive">{procesarGasto.error.message}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}