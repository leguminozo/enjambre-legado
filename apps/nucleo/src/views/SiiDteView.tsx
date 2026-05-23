import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { calcularIVA, calcularTotal } from "@enjambre/contable";
import { FileText, Plus, Loader2, Send, Car, AlertCircle, CheckCircle2, Clock, Receipt, Globe, DollarSign } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.warn("[SiiDteView] NEXT_PUBLIC_API_URL no configurada — usando fallback localhost");
}

function getApiUrl(): string {
  return API_URL ?? "http://localhost:3001";
}

type FacturaCompraRow = {
  id: string;
  folio: number;
  fecha_emision: string;
  receptor_rut: string;
  receptor_razon_social: string;
  monto_neto: number;
  monto_iva: number;
  monto_total: number;
  estado_sii: "pendiente" | "enviado" | "aceptado" | "rechazado";
  descripcion: string | null;
  source_type: string | null;
  track_id: string | null;
};

type SiiDashboard = {
  totalComprasNeto: number;
  totalComprasIva: number;
  totalCompras: number;
  totalFacturasCompra: number;
  pendientesEnvio: number;
};

type GastoParseado = {
  proveedorId: string;
  proveedorRut: string;
  proveedorNombre: string;
  proveedorGiro: string;
  montoOriginal: number;
  monedaOriginal: string;
  montoCLP: number;
  tasaCambio: number;
  montoNeto: number;
  montoExento: number;
  montoIva: number;
  montoTotal: number;
  fechaEmision: string;
  numeroDocumento: string;
  concepto: string;
  detalle: string;
};

type ProveedorInfo = {
  id: string;
  nombre: string;
  rut: string;
  giro: string;
  moneda: string;
  conIva: boolean;
  keywords: string[];
};

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(value);
}

function estadoBadge(estado: string) {
  const map: Record<string, { icon: React.ReactNode; className: string }> = {
    pendiente: { icon: <Clock size={14} />, className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    enviado: { icon: <Send size={14} />, className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    aceptado: { icon: <CheckCircle2 size={14} />, className: "bg-green-500/10 text-green-600 border-green-500/20" },
    rechazado: { icon: <AlertCircle size={14} />, className: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  const cfg = map[estado] ?? map.pendiente;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cfg.className}`}>
      {cfg.icon} {estado}
    </span>
  );
}

function sourceBadge(sourceType: string | null) {
  if (!sourceType) return "Manual";
  const icons: Record<string, React.ReactNode> = {
    uber: <Car size={14} className="text-accent" />,
    "google-ads": <Globe size={14} className="text-blue-500" />,
    "meta-ads": <Globe size={14} className="text-indigo-500" />,
    hostinger: <Globe size={14} className="text-purple-500" />,
    aws: <Globe size={14} className="text-orange-500" />,
    shopify: <Globe size={14} className="text-green-500" />,
    stripe: <Globe size={14} className="text-indigo-400" />,
  };
  const labels: Record<string, string> = {
    uber: "Uber",
    "google-ads": "Google Ads",
    "meta-ads": "Meta Ads",
    hostinger: "Hostinger",
    aws: "AWS",
    shopify: "Shopify",
    stripe: "Stripe",
  };
  const icon = icons[sourceType];
  const label = labels[sourceType] ?? sourceType;
  return icon ? <span className="inline-flex items-center gap-1">{icon} {label}</span> : label;
}

export default function SiiDteView() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"list" | "manual" | "gasto">("list");
  const [folio, setFolio] = useState("");
  const [terceroId, setTerceroId] = useState("");
  const [montoNeto, setMontoNeto] = useState("");
  const [receptorRut, setReceptorRut] = useState("");
  const [receptorNombre, setReceptorNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [receiptText, setReceiptText] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [gastoParseado, setGastoParseado] = useState<GastoParseado | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["sii", "dashboard"],
    queryFn: async (): Promise<SiiDashboard> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sin sesion");

      const res = await fetch(`${getApiUrl()}/api/sii/dashboard`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Error cargando dashboard SII");
      const json = await res.json();
      return json.data;
    },
    retry: false,
  });

  const facturasQuery = useQuery({
    queryKey: ["sii", "facturas-compra"],
    queryFn: async (): Promise<FacturaCompraRow[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sin sesion");

      const res = await fetch(`${getApiUrl()}/api/sii/facturas-compra`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Error cargando facturas de compra");
      const json = await res.json();
      return json.data ?? [];
    },
    retry: false,
  });

  const proveedoresQuery = useQuery({
    queryKey: ["sii", "proveedores"],
    queryFn: async (): Promise<ProveedorInfo[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sin sesion");

      const res = await fetch(`${getApiUrl()}/api/sii/gastos-extranjero/proveedores`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Error cargando proveedores");
      const json = await res.json();
      return json.data ?? [];
    },
    retry: false,
  });

  const createManual = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sin sesion");

      const res = await fetch(`${getApiUrl()}/api/sii/facturas-compra`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tercero_id: terceroId,
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
      setMode("list");
    },
  });

  const parseGasto = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sin sesion");

      const res = await fetch(`${getApiUrl()}/api/sii/gastos-extranjero/parse`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receipt_text: receiptText,
          proveedor_id: proveedorId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error parseando recibo");
      }
      return res.json();
    },
    onSuccess: (result) => {
      setGastoParseado(result.data);
    },
  });

  const facturarGasto = useMutation({
    mutationFn: async () => {
      if (!gastoParseado) throw new Error("No hay gasto parseado");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sin sesion");

      const res = await fetch(`${getApiUrl()}/api/sii/gastos-extranjero/facturar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
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
      setMode("list");
    },
  });

  const onSubmitManual = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createManual.mutate();
  };

  const onSubmitParse = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    parseGasto.mutate();
  };

  const dash = dashboardQuery.data;
  const proveedores = proveedoresQuery.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          <FileText size={20} />
        </div>
        <div>
          <h1 className="font-display text-4xl font-light tracking-tight text-foreground">SII · Factura de Compra</h1>
          <p className="text-muted-foreground text-sm tracking-wide">Emision DTE tipo 46 — gastos nacionales y extranjeros</p>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Compras neto" value={dash?.totalComprasNeto ?? 0} accent />
        <StatCard label="IVA recuperable" value={dash?.totalComprasIva ?? 0} />
        <StatCard label="Total compras" value={dash?.totalCompras ?? 0} />
        <StatCard label="Pendientes envio" value={dash?.pendientesEnvio ?? 0} isCount />
      </section>

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setMode("list")} className={`btn flex items-center gap-2 ${mode === "list" ? "btn-gold" : "btn-outline"}`}>
          <FileText size={16} /> Listado
        </button>
        <button onClick={() => setMode("manual")} className={`btn flex items-center gap-2 ${mode === "manual" ? "btn-gold" : "btn-outline"}`}>
          <Plus size={16} /> Manual
        </button>
        <button onClick={() => setMode("gasto")} className={`btn flex items-center gap-2 ${mode === "gasto" ? "btn-gold" : "btn-outline"}`}>
          <Receipt size={16} /> Desde recibo
        </button>
      </div>

      {mode === "manual" && (
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
              <label className="text-xs text-muted-foreground mb-1 block">Razon social proveedor</label>
              <input value={receptorNombre} onChange={(e) => setReceptorNombre(e.target.value)} placeholder="Ej: UBER CHILE SPA" required className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tercero ID (UUID)</label>
              <input value={terceroId} onChange={(e) => setTerceroId(e.target.value)} placeholder="UUID del tercero" required className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descripcion (opcional)</label>
              <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Concepto" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            {montoNeto && Number(montoNeto) > 0 && (
              <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3 space-y-1">
                <div>Neto: {formatCLP(Number(montoNeto))}</div>
                <div>IVA (19%): {formatCLP(calcularIVA(Number(montoNeto)))}</div>
                <div className="font-bold text-foreground">Total: {formatCLP(calcularTotal(Number(montoNeto)))}</div>
              </div>
            )}
            <button type="submit" disabled={createManual.isPending} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50">
              {createManual.isPending ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Crear factura de compra"}
            </button>
            {createManual.isError && <p className="text-sm text-destructive">{createManual.error.message}</p>}
          </form>
        </section>
      )}

      {mode === "gasto" && (
        <section className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display text-lg mb-2 flex items-center gap-2">
            <Receipt size={18} /> Recibo → Factura de Compra
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Pega el texto de cualquier recibo (Uber, Google Ads, Meta, Hostinger, AWS, Shopify, Stripe).
            El sistema detecta el proveedor, convierte moneda, y genera la Factura de Compra tipo 46.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {proveedores.map((p) => (
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
            ))}
          </div>

          {!gastoParseado ? (
            <form onSubmit={onSubmitParse} className="grid gap-4 max-w-lg">
              <textarea
                value={receiptText}
                onChange={(e) => setReceiptText(e.target.value)}
                placeholder="Pega aqui el texto del recibo, invoice, o billing statement..."
                rows={8}
                required
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono resize-y"
              />
              <button type="submit" disabled={parseGasto.isPending} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50">
                {parseGasto.isPending ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Analizar recibo"}
              </button>
              {parseGasto.isError && <p className="text-sm text-destructive">{parseGasto.error.message}</p>}
            </form>
          ) : (
            <div className="grid gap-4 max-w-lg">
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-accent font-bold">
                  <CheckCircle2 size={16} /> {gastoParseado.proveedorNombre}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                  <span>RUT:</span><span className="text-foreground">{gastoParseado.proveedorRut}</span>
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
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monto original:</span>
                        <span>{gastoParseado.monedaOriginal} {gastoParseado.montoOriginal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tasa de cambio:</span>
                        <span>${gastoParseado.tasaCambio.toLocaleString("es-CL")}/USD</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto CLP:</span>
                    <span className="font-bold">{formatCLP(gastoParseado.montoCLP)}</span>
                  </div>
                  {gastoParseado.montoExento > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exento (sin IVA):</span>
                      <span>{formatCLP(gastoParseado.montoExento)}</span>
                    </div>
                  )}
                  {gastoParseado.montoNeto > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Neto:</span>
                        <span>{formatCLP(gastoParseado.montoNeto)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IVA (19%):</span>
                        <span>{formatCLP(gastoParseado.montoIva)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-bold text-foreground border-t border-border pt-1">
                    <span>Total:</span>
                    <span>{formatCLP(gastoParseado.montoTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => facturarGasto.mutate()}
                  disabled={facturarGasto.isPending}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {facturarGasto.isPending ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Emitir Factura de Compra"}
                </button>
                <button
                  onClick={() => { setGastoParseado(null); setReceiptText(""); }}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground"
                >
                  Volver
                </button>
              </div>
              {facturarGasto.isError && <p className="text-sm text-destructive">{facturarGasto.error.message}</p>}
            </div>
          )}
        </section>
      )}

      {mode === "list" && (
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
                </tr>
              </thead>
              <tbody>
                {facturasQuery.isLoading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
                ) : (facturasQuery.data ?? []).length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Sin facturas de compra</td></tr>
                ) : (
                  (facturasQuery.data ?? []).map((f) => (
                    <tr key={f.id} className="border-b border-border/50 hover:bg-secondary/50">
                      <td className="px-4 py-3 text-sm font-mono">{f.folio}</td>
                      <td className="px-4 py-3 text-sm">{new Date(f.fecha_emision).toLocaleDateString("es-CL")}</td>
                      <td className="px-4 py-3 text-sm">{f.receptor_razon_social}</td>
                      <td className="px-4 py-3 text-sm">{formatCLP(f.monto_neto)}</td>
                      <td className="px-4 py-3 text-sm">{formatCLP(f.monto_iva)}</td>
                      <td className="px-4 py-3 text-sm font-bold">{formatCLP(f.monto_total)}</td>
                      <td className="px-4 py-3">{estadoBadge(f.estado_sii)}</td>
                      <td className="px-4 py-3 text-sm">{sourceBadge(f.source_type)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
        {isCount ? value : (isNegative ? "-" : "") + formatCLP(Math.abs(value))}
      </div>
    </div>
  );
}
