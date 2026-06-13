import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { calcularIVA, calcularTotal } from "@enjambre/contable";
import { FileText, Plus, Loader2, Send, Car, AlertCircle, CheckCircle2, Clock, Receipt, Globe, DollarSign, Settings2, Calculator, Users, RefreshCw, BookOpen, Save } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatCurrency } from "@/lib/format";

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

type HonorarioRow = {
  id: string;
  fecha: string;
  monto_bruto: number;
  monto_retencion: number;
  tasa_retencion: number;
  descripcion: string;
  numero_bhe: string | null;
  estado: string;
  tercero: { id: string; nombre: string; rut: string } | null;
};

type RcvSyncRow = {
  id: string;
  periodo: string;
  tipo_registro: string;
  total_documentos: number;
  total_neto: number;
  total_iva: number;
  total_total: number;
  ultimo_sync: string;
  estado: string;
};

type RcvRegistroRow = {
  id: string;
  tipo_dte: number;
  folio: number;
  fecha_emision: string;
  rut_contraparte: string;
  razon_social_contraparte: string;
  monto_neto: number;
  monto_exento: number;
  monto_iva: number;
  monto_total: number;
  estado_rcv: string;
  reconciliado: boolean;
};



function estadoBadge(estado: string) {
  const map: Record<string, { icon: React.ReactNode; className: string }> = {
    pendiente: { icon: <Clock size={14} />, className: "bg-primary/10 text-primary border-primary/20" },
    enviado: { icon: <Send size={14} />, className: "bg-surface-raised text-foreground border-border" },
    aceptado: { icon: <CheckCircle2 size={14} />, className: "bg-primary/10 text-primary border-primary/20" },
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
    "google-ads": <Globe size={14} className="text-foreground" />,
    "meta-ads": <Globe size={14} className="text-foreground" />,
    hostinger: <Globe size={14} className="text-foreground" />,
    aws: <Globe size={14} className="text-destructive" />,
    shopify: <Globe size={14} className="text-primary" />,
    stripe: <Globe size={14} className="text-foreground" />,
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

export function SiiDteView() {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();
  const [mode, setMode] = useState<"list" | "manual" | "gasto" | "settings" | "f29" | "f22" | "honorarios" | "rcv">("list");
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
      const res = await apiFetch("/api/sii/dashboard");
      if (!res.ok) throw new Error("Error cargando dashboard SII");
      const json = await res.json();
      return json.data;
    },
    retry: false,
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

  const createManual = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/sii/facturas-compra", {
        method: "POST",
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
      return res.json();
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
      setMode("list");
    },
  });

  type EmpresaSettings = {
    id: string;
    rut: string;
    razon_social: string;
    regimen: string;
    acteco: number | null;
    sii_ambiente: string;
    fecha_inicio_actividades: string | null;
    ingresos_brutos_anio_anterior: number | null;
    has_clave_sii: boolean;
  };

  const empresaQuery = useQuery({
    queryKey: ["sii", "empresa"],
    queryFn: async (): Promise<EmpresaSettings> => {
      const res = await apiFetch("/api/sii/empresa");
      if (!res.ok) throw new Error("Error cargando datos empresa");
      const json = await res.json();
      return json.data;
    },
    retry: false,
  });

  const [settingsForm, setSettingsForm] = useState({
    regimen: "",
    acteco: "",
    sii_ambiente: "certificacion",
    fecha_inicio_actividades: "",
    ingresos_brutos_anio_anterior: "",
  });

  const updateEmpresa = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await apiFetch("/api/sii/empresa", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error actualizando empresa");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
    },
  });

  const [siiClave, setSiiClave] = useState("");
  const [showSiiClave, setShowSiiClave] = useState(false);

  const saveSiiClave = useMutation({
    mutationFn: async (clave: string) => {
      const res = await apiFetch("/api/sii/empresa/sii-clave", {
        method: "PUT",
        body: JSON.stringify({ clave }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error guardando clave SII");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
      setSiiClave("");
      setShowSiiClave(false);
    },
  });

  const deleteSiiClave = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/sii/empresa/sii-clave", {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error eliminando clave SII");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
    },
  });

  const [f29Anio, setF29Anio] = useState(String(new Date().getFullYear()));
  const [f29Mes, setF29Mes] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));

  const f29Query = useQuery({
    queryKey: ["sii", "f29", f29Anio, f29Mes],
    queryFn: async () => {
      const res = await apiFetch(`/api/sii/f29/${f29Anio}/${f29Mes}`);
      if (!res.ok) throw new Error("Error cargando F29");
      const json = await res.json();
      return json.data as Record<string, unknown>;
    },
    enabled: mode === "f29" && f29Anio.length === 4 && f29Mes.length >= 1,
    retry: false,
  });

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
    enabled: mode === "honorarios",
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

  const [rcvPeriodo, setRcvPeriodo] = useState(`${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`);

  const rcvQuery = useQuery({
    queryKey: ["sii", "rcv", rcvPeriodo],
    queryFn: async () => {
      const res = await apiFetch(`/api/sii/rcv/${rcvPeriodo}?tipo=compras`);
      if (!res.ok) throw new Error("Error cargando RCV");
      const json = await res.json();
      return json.data as { sync: RcvSyncRow | null; registros: RcvRegistroRow[] };
    },
    enabled: mode === "rcv",
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

  const [f22Anio, setF22Anio] = useState(String(new Date().getFullYear() - 1));

  const f22Query = useQuery({
    queryKey: ["sii", "f22", f22Anio],
    queryFn: async () => {
      const res = await apiFetch(`/api/sii/f22/${f22Anio}`);
      if (!res.ok) throw new Error("Error cargando F22");
      const json = await res.json();
      return json.data as Record<string, unknown>;
    },
    enabled: mode === "f22" && f22Anio.length === 4,
    retry: false,
  });

  const [f29GuardarAnio, setF29GuardarAnio] = useState(0);
  const [f29GuardarMes, setF29GuardarMes] = useState(0);

  const guardarF29 = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/sii/f29/${f29GuardarAnio}/${f29GuardarMes}/guardar`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error guardando F29");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
    },
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
        <button onClick={() => setMode("settings")} className={`btn flex items-center gap-2 ${mode === "settings" ? "btn-gold" : "btn-outline"}`}>
          <Settings2 size={16} /> Config SII
        </button>
        <button onClick={() => setMode("f29")} className={`btn flex items-center gap-2 ${mode === "f29" ? "btn-gold" : "btn-outline"}`}>
          <Calculator size={16} /> F29
        </button>
        <button onClick={() => setMode("honorarios")} className={`btn flex items-center gap-2 ${mode === "honorarios" ? "btn-gold" : "btn-outline"}`}>
          <Users size={16} /> Honorarios
        </button>
        <button onClick={() => setMode("rcv")} className={`btn flex items-center gap-2 ${mode === "rcv" ? "btn-gold" : "btn-outline"}`}>
          <RefreshCw size={16} /> RCV
        </button>
        <button onClick={() => setMode("f22")} className={`btn flex items-center gap-2 ${mode === "f22" ? "btn-gold" : "btn-outline"}`}>
          <BookOpen size={16} /> F22
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
                <div>Neto: {formatCurrency(Number(montoNeto))}</div>
                <div>IVA (19%): {formatCurrency(calcularIVA(Number(montoNeto)))}</div>
                <div className="font-bold text-foreground">Total: {formatCurrency(calcularTotal(Number(montoNeto)))}</div>
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
                    <span className="font-bold">{formatCurrency(gastoParseado.montoCLP)}</span>
                  </div>
                  {gastoParseado.montoExento > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exento (sin IVA):</span>
                      <span>{formatCurrency(gastoParseado.montoExento)}</span>
                    </div>
                  )}
                  {gastoParseado.montoNeto > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Neto:</span>
                        <span>{formatCurrency(gastoParseado.montoNeto)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IVA (19%):</span>
                        <span>{formatCurrency(gastoParseado.montoIva)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-bold text-foreground border-t border-border pt-1">
                    <span>Total:</span>
                    <span>{formatCurrency(gastoParseado.montoTotal)}</span>
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

{mode === "settings" && (
  <section className="bg-card border border-border rounded-2xl p-6">
    <h3 className="font-display text-lg mb-4 flex items-center gap-2">
      <Settings2 size={18} /> Configuracion SII Empresa
    </h3>

    {empresaQuery.isLoading ? (
      <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={24} /></div>
    ) : empresaQuery.isError ? (
      <p className="text-sm text-destructive">{empresaQuery.error.message}</p>
    ) : (() => {
      const emp = empresaQuery.data;
      if (!emp) return null;

      const currentSettings = {
        regimen: settingsForm.regimen || emp.regimen || "pro_pyme_transparente",
        acteco: settingsForm.acteco || String(emp.acteco ?? ""),
        sii_ambiente: settingsForm.sii_ambiente || emp.sii_ambiente || "certificacion",
        fecha_inicio_actividades: settingsForm.fecha_inicio_actividades || (emp.fecha_inicio_actividades ?? "").slice(0, 10),
        ingresos_brutos_anio_anterior: settingsForm.ingresos_brutos_anio_anterior || String(emp.ingresos_brutos_anio_anterior ?? ""),
      };

      const handleSave = () => {
        const patch: Record<string, unknown> = {};
        if (currentSettings.regimen !== emp.regimen) patch.regimen = currentSettings.regimen;
        if (currentSettings.acteco !== String(emp.acteco ?? "")) patch.acteco = Number(currentSettings.acteco) || null;
        if (currentSettings.sii_ambiente !== emp.sii_ambiente) patch.sii_ambiente = currentSettings.sii_ambiente;
        if (currentSettings.fecha_inicio_actividades !== (emp.fecha_inicio_actividades ?? "").slice(0, 10)) patch.fecha_inicio_actividades = currentSettings.fecha_inicio_actividades || null;
        if (currentSettings.ingresos_brutos_anio_anterior !== String(emp.ingresos_brutos_anio_anterior ?? "")) patch.ingresos_brutos_anio_anterior = Number(currentSettings.ingresos_brutos_anio_anterior) || 0;

        if (Object.keys(patch).length === 0) return;
        updateEmpresa.mutate(patch);
      };

      const regimenLabels: Record<string, string> = {
        pro_pyme_transparente: "Pyme Transparente (Art. 14 D N°8)",
        pro_pyme_general: "Pro Pyme General (Art. 14 D N°3)",
        semi_integrado: "Semi Integrado",
        general: "General",
      };

      return (
        <div className="grid gap-4 max-w-lg">
          <div className="p-3 bg-secondary rounded-lg text-sm">
            <span className="text-muted-foreground">RUT:</span> <span className="font-mono text-foreground">{emp.rut}</span>
            <span className="ml-4 text-muted-foreground">Razon Social:</span> <span className="text-foreground">{emp.razon_social}</span>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Regimen tributario</label>
            <select
              value={currentSettings.regimen}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, regimen: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(regimenLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Acteco (codigo SII)</label>
              <input
                value={currentSettings.acteco}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, acteco: e.target.value }))}
                placeholder="Ej: 731000"
                type="number"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ambiente SII</label>
              <select
                value={currentSettings.sii_ambiente}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, sii_ambiente: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="certificacion">Certificacion (Maullin)</option>
                <option value="produccion">Produccion (Palena)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fecha inicio actividades</label>
              <input
                value={currentSettings.fecha_inicio_actividades}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, fecha_inicio_actividades: e.target.value }))}
                type="date"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ingresos brutos anio anterior (CLP)</label>
              <input
                value={currentSettings.ingresos_brutos_anio_anterior}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, ingresos_brutos_anio_anterior: e.target.value }))}
                placeholder="Ej: 5000000"
                type="number"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={updateEmpresa.isPending}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {updateEmpresa.isPending ? <Loader2 className="animate-spin" size={18} /> : "Guardar cambios"}
            </button>
            {updateEmpresa.isSuccess && <span className="text-sm text-primary"><CheckCircle2 size={14} className="inline" /> Guardado</span>}
        {updateEmpresa.isError && <span className="text-sm text-destructive">{updateEmpresa.error.message}</span>}
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Clave SII (credenciales portal)</h4>
          <p className="text-xs text-muted-foreground mb-3">Se almacena encriptada. Se usa para obtener token SII y consultar RCV.</p>

          {emp.has_clave_sii && !showSiiClave ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-primary/10 text-primary border-primary/20">
                <CheckCircle2 size={12} /> Clave configurada
              </span>
              <button onClick={() => setShowSiiClave(true)} className="text-xs text-muted-foreground hover:text-foreground underline">Cambiar</button>
              <button onClick={() => deleteSiiClave.mutate()} disabled={deleteSiiClave.isPending} className="text-xs text-destructive hover:underline disabled:opacity-50">
                {deleteSiiClave.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          ) : (
            <div className="grid gap-3 max-w-sm">
              <input
                value={siiClave}
                onChange={(e) => setSiiClave(e.target.value)}
                type="password"
                placeholder="Ingresa tu clave SII"
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => saveSiiClave.mutate(siiClave)}
                  disabled={saveSiiClave.isPending || !siiClave || siiClave.length < 4}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {saveSiiClave.isPending ? <Loader2 className="animate-spin" size={16} /> : "Guardar clave"}
                </button>
                {emp.has_clave_sii && (
                  <button onClick={() => { setShowSiiClave(false); setSiiClave(""); }} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                )}
              </div>
              {saveSiiClave.isError && <p className="text-sm text-destructive">{saveSiiClave.error.message}</p>}
              {saveSiiClave.isSuccess && <p className="text-sm text-primary"><CheckCircle2 size={14} className="inline" /> Clave guardada</p>}
            </div>
          )}
        </div>
        </div>
      );
    })()}
  </section>
)}

  {mode === "f29" && (
    <section className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-display text-lg mb-4 flex items-center gap-2">
        <Calculator size={18} /> Declaracion F29
      </h3>

      <div className="flex gap-3 mb-4 max-w-md">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Anio</label>
          <input value={f29Anio} onChange={(e) => setF29Anio(e.target.value)} type="number" min="2000" max="2099" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Mes</label>
          <select value={f29Mes} onChange={(e) => setF29Mes(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={String(m).padStart(2, "0")}>{String(m).padStart(2, "0")}</option>
            ))}
          </select>
        </div>
      </div>

      {f29Query.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={24} /></div>
      ) : f29Query.isError ? (
        <p className="text-sm text-destructive">{f29Query.error.message}</p>
) : f29Query.data ? (
  <>
    <div className="space-y-3">
          <F29LineItem label="Debito facturas (cod 503)" value={Number(f29Query.data.debitoFacturas ?? 0)} />
          <F29LineItem label="Debito boletas (cod 110)" value={Number(f29Query.data.debitoBoletas ?? 0)} />
          <F29LineItem label="Total debito IVA" value={Number(f29Query.data.totalDebito ?? 0)} />
          <div className="border-t border-border pt-2" />
          <F29LineItem label="Credito facturas nacionales (cod 538)" value={Number(f29Query.data.creditoFacturas ?? 0)} />
          <F29LineItem label="Credito FC digital (cod 519/520)" value={Number(f29Query.data.creditoFacturaCompraDigital ?? 0)} />
          <F29LineItem label="Total credito IVA" value={Number(f29Query.data.totalCredito ?? 0)} />
          <div className="border-t border-border pt-2" />
          <F29LineItem label="Remanente CF anterior reajustado (cod 504)" value={Number(f29Query.data.remanenteCFAnteriorReajustado ?? 0)} />
          <F29LineItem label="Remanente CF periodo" value={Number(f29Query.data.remanenteCFPeriodo ?? 0)} />
          <div className="border-t border-border pt-2" />
          <F29LineItem label="IVA a pagar (cod 89)" value={Number(f29Query.data.ivaPagar ?? 0)} highlight />
          <F29LineItem label="Remanente CF siguiente (cod 77)" value={Number(f29Query.data.remanenteCFSiguiente ?? 0)} />
          <div className="border-t border-border pt-2" />
          <F29LineItem label="Retencion honorarios (cod 151)" value={Number(f29Query.data.retencionHonorarios ?? 0)} />
          <F29LineItem label="PPM base (cod 563)" value={Number(f29Query.data.ppmBase ?? 0)} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>PPM tasa (cod 115): {((Number(f29Query.data.ppmTasa ?? 0)) * 100).toFixed(3)}%</span>
          </div>
            <F29LineItem label="PPM monto (cod 62)" value={Number(f29Query.data.ppmMonto ?? 0)} highlight />
            </div>

            <div className="border-t border-border pt-4 mt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  setF29GuardarAnio(Number(f29Anio));
                  setF29GuardarMes(Number(f29Mes));
                  guardarF29.mutate();
                }}
                disabled={guardarF29.isPending}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2"
              >
                {guardarF29.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={14} />} Guardar como declaracion F29
              </button>
              {guardarF29.isSuccess && <span className="text-sm text-primary"><CheckCircle2 size={14} className="inline" /> Guardada</span>}
              {guardarF29.isError && <span className="text-sm text-destructive">{guardarF29.error.message}</span>}
            </div>
          </>
        ) : null}
      </section>
    )}

    {mode === "f22" && (
    <section className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-display text-lg mb-4 flex items-center gap-2">
        <BookOpen size={18} /> Declaracion F22 — Anual
      </h3>

      <div className="flex gap-3 mb-4 max-w-xs">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Anio comercial</label>
          <input value={f22Anio} onChange={(e) => setF22Anio(e.target.value)} type="number" min="2000" max="2099" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      {f22Query.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={24} /></div>
      ) : f22Query.isError ? (
        <p className="text-sm text-destructive">{f22Query.error.message}</p>
      ) : f22Query.data ? (() => {
        const f22 = f22Query.data;
        const isTransparente = f22.regimen === "pro_pyme_transparente";
        return (
          <div className="space-y-3">
            <div className="p-3 bg-secondary rounded-lg text-xs text-muted-foreground">
              Regimen: <span className="text-foreground font-bold">{String(f22.regimen ?? "")}</span>
              {isTransparente && <span className="ml-2 text-primary">(Transparencia — IDPC exenta, atribucion directa)</span>}
            </div>

            {isTransparente && (
              <>
                <F29LineItem label="Base imponible transparencia (cod 1609)" value={Number(f22.baseImponibleTransparente ?? 0)} />
                <F29LineItem label="Atribucion al dueño (cod 1610)" value={Number(f22.atribucionDueno ?? 0)} />
              </>
            )}

            <div className="border-t border-border pt-2" />
            <F29LineItem label="PPM total pagado en el anio" value={Number(f22.ppmTotalPagado ?? 0)} />
            <F29LineItem label="PPM credito personal DJ 1947 (cod 1645)" value={Number(f22.ppmCreditoPersonal ?? 0)} />
            <div className="border-t border-border pt-2" />
            <F29LineItem label="Retenciones honorarios total (cod 1665)" value={Number(f22.retencionesHonorariosTotal ?? 0)} />
            <F29LineItem label="IVA debito anual" value={Number(f22.ivaDebitoAnual ?? 0)} />
            <F29LineItem label="IVA credito anual" value={Number(f22.ivaCreditoAnual ?? 0)} />
          </div>
        );
      })() : null}
    </section>
  )}

  {mode === "honorarios" && (
    <section className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-display text-lg mb-4 flex items-center gap-2">
        <Users size={18} /> Honorarios — Retencion 15.25%
      </h3>

      <div className="bg-secondary/50 rounded-lg p-4 mb-6 max-w-lg">
        <h4 className="text-sm font-bold text-foreground mb-3">Registrar honorario</h4>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fecha</label>
              <input value={honorarioFecha} onChange={(e) => setHonorarioFecha(e.target.value)} type="date" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Monto bruto (CLP)</label>
              <input value={honorarioMonto} onChange={(e) => setHonorarioMonto(e.target.value)} type="number" placeholder="Ej: 500000" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Descripcion</label>
            <input value={honorarioDescripcion} onChange={(e) => setHonorarioDescripcion(e.target.value)} placeholder="Ej: Servicios contables" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          {honorarioMonto && Number(honorarioMonto) > 0 && (
            <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3 space-y-1">
              <div>Bruto: {formatCurrency(Number(honorarioMonto))}</div>
              <div>Retencion (15.25%): {formatCurrency(Math.round(Number(honorarioMonto) * 0.1525))}</div>
              <div className="font-bold text-foreground">Neto prestador: {formatCurrency(Number(honorarioMonto) - Math.round(Number(honorarioMonto) * 0.1525))}</div>
            </div>
          )}
          <button
            onClick={() => createHonorario.mutate()}
            disabled={createHonorario.isPending || !honorarioMonto || !honorarioDescripcion}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {createHonorario.isPending ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Registrar honorario"}
          </button>
          {createHonorario.isError && <p className="text-sm text-destructive">{createHonorario.error.message}</p>}
          {createHonorario.isSuccess && <p className="text-sm text-primary"><CheckCircle2 size={14} className="inline" /> Registrado</p>}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Historial</h4>
        {honorariosQuery.isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin" size={20} /></div>
        ) : (honorariosQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin honorarios registrados</p>
        ) : (
          <div className="space-y-2">
            {(honorariosQuery.data ?? []).map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg text-sm">
                <div>
                  <span className="text-foreground">{h.descripcion}</span>
                  <span className="text-muted-foreground ml-2">{new Date(h.fecha).toLocaleDateString("es-CL")}</span>
                  {h.tercero && <span className="text-muted-foreground ml-2">({h.tercero.nombre})</span>}
                </div>
                <div className="text-right">
                  <div className="text-foreground">{formatCurrency(h.monto_bruto)}</div>
                  <div className="text-xs text-destructive">Ret: {formatCurrency(h.monto_retencion)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )}

  {mode === "rcv" && (
    <section className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-display text-lg mb-4 flex items-center gap-2">
        <RefreshCw size={18} /> RCV — Registro de Compras y Ventas
      </h3>

      <div className="flex gap-3 mb-4 items-end">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Periodo (YYYYMM)</label>
          <input value={rcvPeriodo} onChange={(e) => setRcvPeriodo(e.target.value)} placeholder="202606" maxLength={6} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-28" />
        </div>
        <button
          onClick={() => rcvSync.mutate()}
          disabled={rcvSync.isPending}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2"
        >
          {rcvSync.isPending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={14} />} Sincronizar SII
        </button>
        {rcvSync.isError && <span className="text-sm text-destructive">{rcvSync.error.message}</span>}
        {rcvSync.isSuccess && <span className="text-sm text-primary"><CheckCircle2 size={14} className="inline" /> Sincronizado</span>}
      </div>

      {rcvQuery.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={24} /></div>
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
                <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                  <div className="text-xs text-muted-foreground">Documentos</div>
                  <div className="text-foreground font-bold">{s.total_documentos}</div>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                  <div className="text-xs text-muted-foreground">Total neto</div>
                  <div className="text-foreground font-bold">{formatCurrency(s.total_neto)}</div>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                  <div className="text-xs text-muted-foreground">Total IVA</div>
                  <div className="text-foreground font-bold">{formatCurrency(s.total_iva)}</div>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                  <div className="text-xs text-muted-foreground">Ultimo sync</div>
                  <div className="text-foreground text-xs">{new Date(s.ultimo_sync).toLocaleString("es-CL")}</div>
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
                          <td className="px-3 py-2 text-sm">{r.tipo_dte}</td>
                          <td className="px-3 py-2 text-sm font-mono">{r.folio}</td>
                          <td className="px-3 py-2 text-sm">{new Date(r.fecha_emision).toLocaleDateString("es-CL")}</td>
                          <td className="px-3 py-2 text-sm font-mono">{r.rut_contraparte}</td>
                          <td className="px-3 py-2 text-sm">{formatCurrency(r.monto_neto)}</td>
                          <td className="px-3 py-2 text-sm">{formatCurrency(r.monto_iva)}</td>
                          <td className="px-3 py-2 text-sm font-bold">{formatCurrency(r.monto_total)}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${r.reconciliado ? "bg-primary/10 text-primary border-primary/20" : "bg-surface-raised text-muted-foreground border-border"}`}>
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

        return <p className="text-sm text-muted-foreground">Sin datos RCV para el periodo {rcvPeriodo}. Presiona Sincronizar SII para obtener del SII.</p>;
      })()}
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
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturasQuery.isLoading ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
                  ) : (facturasQuery.data ?? []).length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Sin facturas de compra</td></tr>
                  ) : (
                    (facturasQuery.data ?? []).map((f) => (
                      <tr key={f.id} className="border-b border-border/50 hover:bg-secondary/50">
                        <td className="px-4 py-3 text-sm font-mono">{f.folio}</td>
                        <td className="px-4 py-3 text-sm">{new Date(f.fecha_emision).toLocaleDateString("es-CL")}</td>
                        <td className="px-4 py-3 text-sm">{f.receptor_razon_social}</td>
                        <td className="px-4 py-3 text-sm">{formatCurrency(f.monto_neto)}</td>
                        <td className="px-4 py-3 text-sm">{formatCurrency(f.monto_iva)}</td>
                        <td className="px-4 py-3 text-sm font-bold">{formatCurrency(f.monto_total)}</td>
                        <td className="px-4 py-3">{estadoBadge(f.estado_sii)}</td>
                        <td className="px-4 py-3 text-sm">{sourceBadge(f.source_type)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {f.estado_sii === "pendiente" && (
                              <button
                                onClick={() => enviarSiiMutation.mutate(f.id)}
                                disabled={enviarSiiMutation.isPending}
                                className="px-2 py-1 text-xs rounded border border-accent/50 text-accent hover:bg-accent/10 disabled:opacity-50 flex items-center gap-1"
                                title="Enviar al SII"
                              >
                                <Send size={12} /> Enviar
                              </button>
                            )}
                            {f.estado_sii === "enviado" && (
                              <button
                                onClick={() => pollSiiMutation.mutate(f.id)}
                                disabled={pollSiiMutation.isPending}
                                className="px-2 py-1 text-xs rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-50 flex items-center gap-1"
                                title="Consultar estado SII"
                              >
                                <RefreshCw size={12} /> Poll
                              </button>
                            )}
                          </div>
                        </td>
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
        {isCount ? value : (isNegative ? "-" : "") + formatCurrency(Math.abs(value))}
      </div>
    </div>
  );
}

function F29LineItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const isNegative = value < 0;
  return (
    <div className={`flex justify-between items-center py-1 ${highlight ? "font-bold text-foreground" : "text-sm"}`}>
      <span className={highlight ? "" : "text-muted-foreground"}>{label}</span>
      <span className={highlight && value > 0 ? "text-destructive" : ""}>{(isNegative ? "-" : "") + formatCurrency(Math.abs(value))}</span>
    </div>
  );
}
