import { calcularIVA, calcularTotal, FacturaEmitidaInputSchema } from "@enjambre/contable";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware } from "@/api/lib/middleware";
import { tenantMiddleware } from "@/api/lib/middleware";

export const contableRoutes = new Hono<{
  Variables: AppVariables;
}>();

contableRoutes.use("*", authMiddleware, tenantMiddleware);

contableRoutes.get("/dashboard", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const [facturasRes, gastosRes] = await Promise.all([
    supabase
      .from("facturas_emitidas")
      .select("monto_neto, monto_iva, monto_total")
      .eq("empresa_id", empresaId),
    supabase
      .from("gastos")
      .select("monto_neto, monto_iva, monto_total")
      .eq("empresa_id", empresaId),
  ]);

  if (facturasRes.error || gastosRes.error) {
    return c.json(
      {
        code: "dashboard_query_failed",
        message: "No fue posible calcular el dashboard",
        details: {
          facturas: facturasRes.error?.message,
          gastos: gastosRes.error?.message,
        },
      },
      500,
    );
  }

  const ingresosNetos = (facturasRes.data ?? []).reduce(
    (acc: number, item: { monto_neto: number | null }) => acc + Number(item.monto_neto ?? 0),
    0,
  );
  const gastosNetos = (gastosRes.data ?? []).reduce(
    (acc: number, item: { monto_neto: number | null }) => acc + Number(item.monto_neto ?? 0),
    0,
  );
  const utilidadNeta = ingresosNetos - gastosNetos;

  return c.json({
    data: {
      empresaId,
      ingresosNetos,
      gastosNetos,
      utilidadNeta,
      totalFacturas: facturasRes.data?.length ?? 0,
      totalGastos: gastosRes.data?.length ?? 0,
    },
  });
});

contableRoutes.post(
  "/facturas-emitidas",
  zValidator("json", FacturaEmitidaInputSchema),
  async (c) => {
    const input = c.req.valid("json");
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");

    const montoIva = calcularIVA(input.monto_neto);
    const montoTotal = calcularTotal(input.monto_neto, montoIva);

  const payload = {
    empresa_id: empresaId,
    tercero_id: input.tercero_id ?? null,
    numero: input.numero,
    fecha_emision: input.fecha_emision,
    monto_neto: input.monto_neto,
    monto_iva: montoIva,
    monto_total: montoTotal,
    monto_exento: 0,
    monto_iva_usado: 0,
    tipo_documento: "Factura",
    descripcion: input.descripcion ?? null,
    idempotency_key: input.idempotency_key ?? null,
    estado: "pendiente",
  };

    const { data, error } = await supabase
      .from("facturas_emitidas")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return c.json(
        {
          code: "factura_create_failed",
          message: "No fue posible crear la factura",
          details: error.message,
        },
        400,
      );
    }

    return c.json({ data }, 201);
  },
);

// ── Libro de compras/ventas mensual + cierre de período ─────────────────

function mesRange(anio: number, mes: number): { desde: string; hasta: string } {
  const desde = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const hasta = new Date(anio, mes, 0); // último día del mes
  return { desde, hasta: `${anio}-${String(mes).padStart(2, "0")}-${String(hasta.getDate()).padStart(2, "0")}T23:59:59.999Z` };
}

contableRoutes.get("/libro", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const tipo = c.req.query("tipo") ?? "ventas";
  const anio = Number(c.req.query("anio") ?? new Date().getFullYear());
  const mes = Number(c.req.query("mes") ?? new Date().getMonth() + 1);
  const { desde, hasta } = mesRange(anio, mes);

  if (tipo === "compras") {
    const [gastosRes, boletasRes] = await Promise.all([
      supabase
        .from("gastos")
        .select("id, fecha, categoria, descripcion, monto_neto, monto_iva, monto_total, estado")
        .eq("empresa_id", empresaId)
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("fecha", { ascending: true })
        .limit(500),
      supabase
        .from("boletas_ingest")
        .select("id, folio, emision_fecha, rut_receptor, razon_social, monto_neto, monto_iva, monto_total, estado")
        .gte("emision_fecha", desde)
        .lte("emision_fecha", hasta.slice(0, 10))
        .order("emision_fecha", { ascending: true })
        .limit(500),
    ]);
    if (gastosRes.error || boletasRes.error) {
      return c.json({ code: "query_failed", message: gastosRes.error?.message ?? boletasRes.error?.message }, 500);
    }
    const activosGastos = (gastosRes.data ?? []).filter((g) => g.estado !== "anulado");
    const activasBoletas = (boletasRes.data ?? []).filter((b) => b.estado !== "anulada");
    const suma = (rows: { monto_total: number | null }[]) =>
      rows.reduce((a, r) => a + Number(r.monto_total ?? 0), 0);
    return c.json({
      data: {
        periodo: { anio, mes },
        filas: [
          ...activosGastos.map((g) => ({
            id: `g-${g.id}`, fecha: g.fecha, detalle: g.descripcion ?? g.categoria,
            neto: g.monto_neto, iva: g.monto_iva, total: g.monto_total, fuente: "gasto",
          })),
          ...activasBoletas.map((b) => ({
            id: `b-${b.id}`, fecha: b.emision_fecha, detalle: b.razon_social ?? `Boleta ${b.folio}`,
            neto: b.monto_neto, iva: b.monto_iva, total: b.monto_total, fuente: "boleta_sii",
          })),
        ],
        totales: {
          neto: Math.round(suma(activosGastos.map((g) => ({ monto_total: g.monto_neto }))) * 100) / 100,
          iva: Math.round(suma(activosGastos.map((g) => ({ monto_total: g.monto_iva }))) * 100) / 100,
          total: Math.round(suma(activosGastos) * 100) / 100 + Math.round(suma(activasBoletas) * 100) / 100,
        },
      },
    });
  }

  // Libro de ventas: DTE emitidos + operaciones POS/web
  const [facturasRes, ventasRes] = await Promise.all([
    supabase
      .from("facturas_emitidas")
      .select("id, numero, fecha_emision, descripcion, monto_neto, monto_iva, monto_total, estado")
      .eq("empresa_id", empresaId)
      .gte("fecha_emision", desde)
      .lte("fecha_emision", hasta)
      .order("fecha_emision", { ascending: true })
      .limit(500),
    supabase
      .from("ventas")
      .select("id, created_at, metodo_pago, total, estado, origen")
      .eq("empresa_id", empresaId)
      .gte("created_at", desde)
      .lte("created_at", hasta)
      .order("created_at", { ascending: true })
      .limit(1000),
  ]);
  if (facturasRes.error || ventasRes.error) {
    return c.json({ code: "query_failed", message: facturasRes.error?.message ?? ventasRes.error?.message }, 500);
  }
  const activas = (facturasRes.data ?? []).filter((f) => f.estado !== "anulada");
  const ventasActivas = (ventasRes.data ?? []).filter((v) => v.estado !== "anulada" && v.estado !== "failed" && v.estado !== "cancelled");
  return c.json({
    data: {
      periodo: { anio, mes },
      filas: [
        ...activas.map((f) => ({
          id: `f-${f.id}`, fecha: f.fecha_emision, detalle: `Factura N°${f.numero}${f.descripcion ? ` — ${f.descripcion}` : ""}`,
          neto: f.monto_neto, iva: f.monto_iva, total: f.monto_total, fuente: "dte",
        })),
        ...ventasActivas.map((v) => ({
          id: `v-${v.id}`, fecha: v.created_at, detalle: `Venta ${v.origen} · ${v.metodo_pago ?? "—"}`,
          neto: null, iva: null, total: v.total, fuente: "operacion",
        })),
      ],
      totales: {
        neto: activas.reduce((a, f) => a + Number(f.monto_neto ?? 0), 0),
        iva: activas.reduce((a, f) => a + Number(f.monto_iva ?? 0), 0),
        total: activas.reduce((a, f) => a + Number(f.monto_total ?? 0), 0)
          + ventasActivas.reduce((a, v) => a + Number(v.total ?? 0), 0),
      },
    },
  });
});

contableRoutes.get("/periodos", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const anio = Number(c.req.query("anio") ?? new Date().getFullYear());
  const { data, error } = await supabase
    .from("periodos_contables")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("anio", anio)
    .order("mes", { ascending: true });
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

const CerrarPeriodoSchema = z.object({
  anio: z.number().int().min(2000),
  mes: z.number().int().min(1).max(12),
}).strict();

contableRoutes.post("/periodos/cerrar", zValidator("json", CerrarPeriodoSchema), async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const { anio, mes } = c.req.valid("json");
  const { data, error } = await supabase
    .from("periodos_contables")
    .upsert(
      { empresa_id: empresaId, anio, mes, estado: "cerrado" },
      { onConflict: "empresa_id,anio,mes" },
    )
    .select()
    .single();
  if (error) return c.json({ code: "cerrar_failed", message: error.message }, 400);
  return c.json({ data });
});
