import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import { API_BASE_URL, apiRequest } from "../lib/api";

type DashboardResponse = {
  data: {
    empresaId: string;
    ingresosNetos: number;
    gastosNetos: number;
    utilidadNeta: number;
    totalFacturas: number;
    totalGastos: number;
  };
};

type FacturaResponse = {
  data: {
    id: string;
    empresa_id: string;
    numero: number;
    monto_neto: number;
    monto_iva: number;
    monto_total: number;
  };
};

export default function ContableView() {
  const [terceroId, setTerceroId] = useState("");
  const [numero, setNumero] = useState("");
  const [montoNeto, setMontoNeto] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const dashboardQuery = useQuery({
    queryKey: ["contable", "dashboard"],
    queryFn: () => apiRequest<DashboardResponse>("/api/contable/dashboard"),
    retry: false,
  });

  const createFactura = useMutation({
    mutationFn: async () =>
      apiRequest<FacturaResponse>("/api/contable/facturas-emitidas", {
        method: "POST",
        body: JSON.stringify({
          tercero_id: terceroId,
          numero: Number(numero),
          fecha_emision: new Date().toISOString(),
          monto_neto: Number(montoNeto),
          descripcion: descripcion || undefined,
        }),
      }),
    onSuccess: () => {
      dashboardQuery.refetch();
      setNumero("");
      setMontoNeto("");
      setDescripcion("");
    },
  });

  const metricas = useMemo(() => dashboardQuery.data?.data, [dashboardQuery.data]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createFactura.mutate();
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2 style={{ margin: 0 }}>Modulo Contable</h2>

      <div
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          background: "rgba(10,61,47,0.06)",
          border: "1px solid rgba(10,61,47,0.12)",
          fontSize: "0.88rem",
          lineHeight: 1.5,
          color: "var(--text-secondary, #374151)",
        }}
      >
        <strong style={{ color: "var(--bosque-ulmo, #0a3d2f)" }}>Estado:</strong> la UI ya está integrada.
        Las <strong>migraciones Supabase</strong> y el enlace al proyecto remoto se harán al mover este repo a su
        carpeta destino final. Mientras tanto, levanta el BFF en <code style={{ fontSize: "0.82em" }}>{API_BASE_URL}</code>{" "}
        (<code style={{ fontSize: "0.82em" }}>pnpm --filter @enjambre/api dev</code>) cuando quieras probar contra datos
        reales.
      </div>

      <section style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <StatCard label="Ingresos netos" value={metricas?.ingresosNetos ?? 0} />
        <StatCard label="Gastos netos" value={metricas?.gastosNetos ?? 0} />
        <StatCard label="Utilidad neta" value={metricas?.utilidadNeta ?? 0} />
      </section>

      <section style={{ padding: 16, border: "1px solid #d1d5db", borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>Crear factura emitida</h3>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 480 }}>
          <input
            value={terceroId}
            onChange={(e) => setTerceroId(e.target.value)}
            placeholder="tercero_id (UUID)"
            required
          />
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="numero factura"
            required
            type="number"
          />
          <input
            value={montoNeto}
            onChange={(e) => setMontoNeto(e.target.value)}
            placeholder="monto neto"
            required
            type="number"
          />
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="descripcion (opcional)"
          />
          <button type="submit" disabled={createFactura.isPending}>
            {createFactura.isPending ? "Guardando..." : "Crear factura"}
          </button>
        </form>
        {createFactura.isError ? (
          <p style={{ color: "#b91c1c" }}>{(createFactura.error as Error).message}</p>
        ) : null}
      </section>

      {dashboardQuery.isError ? (
        <p style={{ color: "#b91c1c", margin: 0 }}>
          {(dashboardQuery.error as Error).message}
        </p>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: "1px solid #d1d5db", borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value.toLocaleString("es-CL")}</div>
    </div>
  );
}
