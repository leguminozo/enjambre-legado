import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { calcularIVA, calcularTotal } from "@enjambre/contable";
import { TrendingUp, FileText, Plus, Loader2 } from "lucide-react";
import { useAuthStore } from "@enjambre/auth";
import { formatCurrency } from "@/lib/format";
import { resolveEmpresaId } from "@/lib/resolve-empresa-id";

type DashboardMetrics = {
  empresaId: string;
  ingresosNetos: number;
  gastosNetos: number;
  utilidadNeta: number;
  totalFacturas: number;
  totalGastos: number;
};

type FacturaRow = {
  id: string;
  empresa_id: string;
  numero: number;
  monto_neto: number;
  monto_iva: number;
  monto_total: number;
  descripcion: string | null;
  fecha_emision: string;
};


export function ContableView() {
  const queryClient = useQueryClient();
  const [terceroId, setTerceroId] = useState("");
  const [numero, setNumero] = useState("");
  const [montoNeto, setMontoNeto] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const dashboardQuery = useQuery({
    queryKey: ["contable", "dashboard"],
    queryFn: async (): Promise<DashboardMetrics> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error("Sin sesión activa");

      const empresaId = await resolveEmpresaId();
      if (!empresaId) throw new Error("Sin empresa asignada");

      const [facturasRes, gastosRes] = await Promise.all([
        supabase.from("facturas_emitidas").select("monto_neto, monto_iva, monto_total").eq("empresa_id", empresaId),
        supabase.from("gastos").select("monto_neto, monto_iva, monto_total").eq("empresa_id", empresaId),
      ]);

      if (facturasRes.error) throw new Error(facturasRes.error.message);
      if (gastosRes.error) throw new Error(gastosRes.error.message);
      const ingresosNetos = (facturasRes.data ?? []).reduce(
        (acc: number, item: Record<string, unknown>) => acc + Number(item.monto_neto ?? 0),
        0
      );
      const gastosNetos = (gastosRes.data ?? []).reduce(
        (acc: number, item: Record<string, unknown>) => acc + Number(item.monto_neto ?? 0),
        0
      );
      return {
        empresaId,
        ingresosNetos,
        gastosNetos,
        utilidadNeta: ingresosNetos - gastosNetos,
        totalFacturas: facturasRes.data?.length ?? 0,
        totalGastos: gastosRes.data?.length ?? 0,
      };
    },
    retry: false,
  });

  const facturasQuery = useQuery({
    queryKey: ["contable", "facturas"],
    queryFn: async (): Promise<FacturaRow[]> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error("Sin sesión activa");

      const empresaId = await resolveEmpresaId();
      if (!empresaId) throw new Error("Sin empresa asignada");

      const { data, error } = await supabase
        .from("facturas_emitidas")
        .select("id, empresa_id, numero, monto_neto, monto_iva, monto_total, descripcion, fecha_emision")
        .eq("empresa_id", empresaId)
        .order("fecha_emision", { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);
      return (data ?? []) as FacturaRow[];
    },
    retry: false,
  });

  const createFactura = useMutation({
    mutationFn: async () => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error("Sin sesión activa");

      const empresaId = await resolveEmpresaId();
      if (!empresaId) throw new Error("Sin empresa asignada");

      const neto = Number(montoNeto);
      const iva = calcularIVA(neto);
      const total = calcularTotal(neto, iva);

      const { data, error } = await supabase
        .from("facturas_emitidas")
        .insert({
          empresa_id: empresaId,
          tercero_id: terceroId,
          numero: Number(numero),
          fecha_emision: new Date().toISOString(),
          monto_neto: neto,
          monto_iva: iva,
          monto_total: total,
          descripcion: descripcion || null,
        })
        .select("id, empresa_id, numero, monto_neto, monto_iva, monto_total, descripcion, fecha_emision")
        .single();

      if (error) throw new Error(error.message);
      return data as FacturaRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contable"] });
      setNumero("");
      setMontoNeto("");
      setDescripcion("");
    },
  });

  const metricas = useMemo(() => dashboardQuery.data, [dashboardQuery.data]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createFactura.mutate();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          <FileText size={20} />
        </div>
        <div>
          <h1 className="font-display text-4xl font-light tracking-tight text-foreground">Sistema Contable</h1>
          <p className="text-muted-foreground text-sm tracking-wide">Facturación, gastos y balance chileno (IVA 19%)</p>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Ingresos netos" value={metricas?.ingresosNetos ?? 0} accent />
        <StatCard label="Gastos netos" value={metricas?.gastosNetos ?? 0} />
        <StatCard
          label="Utilidad neta"
          value={metricas?.utilidadNeta ?? 0}
          accent={(metricas?.utilidadNeta ?? 0) >= 0}
        />
      </section>

      <section className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-display text-lg mb-4 flex items-center gap-2">
          <Plus size={18} /> Crear factura emitida
        </h3>
        <form onSubmit={onSubmit} className="grid gap-4 max-w-lg">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tercero ID (UUID)</label>
            <input
              value={terceroId}
              onChange={(e) => setTerceroId(e.target.value)}
              placeholder="UUID del tercero"
              required
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">N° Factura</label>
              <input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ej: 42"
                required
                type="number"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Monto neto (CLP)</label>
              <input
                value={montoNeto}
                onChange={(e) => setMontoNeto(e.target.value)}
                placeholder="Ej: 100000"
                required
                type="number"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Descripción (opcional)</label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Concepto de la factura"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {montoNeto && Number(montoNeto) > 0 && (
            <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3 space-y-1">
              <div>Neto: {formatCurrency(Number(montoNeto))}</div>
              <div>IVA (19%): {formatCurrency(calcularIVA(Number(montoNeto)))}</div>
              <div className="font-bold text-foreground">Total: {formatCurrency(calcularTotal(Number(montoNeto)))}</div>
            </div>
          )}
          <button
            type="submit"
            disabled={createFactura.isPending}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {createFactura.isPending ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Crear factura"}
          </button>
          {createFactura.isError && (
            <p className="text-sm text-destructive">{createFactura.error.message}</p>
          )}
        </form>
      </section>

      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-display text-lg flex items-center gap-2">
            <TrendingUp size={18} /> Facturas Recientes ({metricas?.totalFacturas ?? 0})
          </h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs text-muted-foreground">N°</th>
              <th className="px-4 py-3 text-left text-xs text-muted-foreground">Fecha</th>
              <th className="px-4 py-3 text-left text-xs text-muted-foreground">Neto</th>
              <th className="px-4 py-3 text-left text-xs text-muted-foreground">IVA</th>
              <th className="px-4 py-3 text-left text-xs text-muted-foreground">Total</th>
            </tr>
          </thead>
          <tbody>
            {facturasQuery.isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  <Loader2 className="animate-spin mx-auto" size={24} />
                </td>
              </tr>
            ) : (facturasQuery.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin facturas</td>
              </tr>
            ) : (
              (facturasQuery.data ?? []).map((f) => (
                <tr key={f.id} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="px-4 py-3 text-sm font-mono">{f.numero}</td>
                  <td className="px-4 py-3 text-sm">{new Date(f.fecha_emision).toLocaleDateString("es-CL")}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(f.monto_neto)}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(f.monto_iva)}</td>
                  <td className="px-4 py-3 text-sm font-bold">{formatCurrency(f.monto_total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {dashboardQuery.isError && (
        <p className="text-sm text-destructive">{dashboardQuery.error.message}</p>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  const isNegative = value < 0;
  return (
    <div className="p-6 rounded-2xl bg-card border border-border">
      <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-display ${accent === true ? "text-accent" : accent === false ? "text-destructive" : ""}`}>
        {isNegative ? "-" : ""}{formatCurrency(Math.abs(value))}
      </div>
    </div>
  );
}
