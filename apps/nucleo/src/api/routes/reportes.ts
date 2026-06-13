import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import type { Database } from "@enjambre/database/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const reportesRoutes = new Hono<{
  Variables: AppVariables;
}>();

reportesRoutes.use("*", authMiddleware, tenantMiddleware);

reportesRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase") as unknown as SupabaseClient<Database>;
  const tipo = c.req.query("tipo");
  const periodo = c.req.query("periodo");

  let query = supabase
    .from("reportes")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (tipo) query = query.eq("tipo", tipo);
  if (periodo) query = query.eq("periodo", periodo);

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json(data ?? []);
});

const reporteSchema = z.object({
  tipo: z.enum(["BalanceGeneral", "EstadoResultados", "FlujoEfectivo", "LibroCompras", "LibroVentas"]),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Formato de periodo inválido (debe ser YYYY-MM)").optional().nullable(),
  mes: z.number().int().min(1).max(12).optional().nullable(),
  anio: z.number().int().min(1900).max(2100).optional().nullable(),
});

reportesRoutes.post("/", zValidator("json", reporteSchema), async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase") as unknown as SupabaseClient<Database>;
  const { tipo, periodo, mes, anio } = c.req.valid("json");

  const computedAnio = anio ?? new Date().getFullYear();
  const computedMes = mes ?? new Date().getMonth() + 1;
  const computedPeriodo = periodo ?? `${computedAnio}-${String(computedMes).padStart(2, "0")}`;

  const { data: periodos } = await supabase
    .from("periodos_contables")
    .select(`
      *,
      facturas_emitidas (
        *,
        tercero:terceros!facturas_emitidas_tercero_id_fkey (id, nombre, rut)
      ),
      facturas_recibidas (
        *,
        proveedor:terceros!facturas_recibidas_proveedor_id_fkey (id, nombre, rut)
      ),
      gastos (
        *,
        proveedor:terceros!gastos_tercero_id_fkey (id, nombre, rut)
      )
    `)
    .eq("empresa_id", empresaId)
    .eq("anio", computedAnio)
    .eq("mes", computedMes);

  const periodoData = periodos?.[0];
  const facturasEmitidas = (periodoData?.facturas_emitidas ?? []) as Array<
    Database["public"]["Tables"]["facturas_emitidas"]["Row"]
  >;
  const facturasRecibidas = (periodoData?.facturas_recibidas ?? []) as Array<
    Database["public"]["Tables"]["facturas_recibidas"]["Row"]
  >;
  const gastos = (periodoData?.gastos ?? []) as Array<
    Database["public"]["Tables"]["gastos"]["Row"]
  >;

  let datos!: Record<string, unknown>;

  switch (tipo) {
    case "BalanceGeneral": {
      const activos = facturasEmitidas.reduce((a, f) => a + Number(f.monto_total ?? 0), 0);
      const pasivos = facturasRecibidas.reduce((a, f) => a + Number(f.monto_total ?? 0), 0);
      const gastosTotal = gastos.reduce((a, g) => a + Number(g.monto_total ?? 0), 0); // Note: using monto_total from gastos
      datos = { activos, pasivos, patrimonio: activos - pasivos - gastosTotal };
      break;
    }
    case "EstadoResultados": {
      const ingresos = facturasEmitidas.reduce((a, f) => a + Number(f.monto_neto ?? 0), 0);
      const gastosNetos = gastos.reduce((a, g) => a + Number(g.monto_neto ?? 0), 0);
      datos = {
        ingresos,
        gastos: gastosNetos,
        utilidadBruta: ingresos - gastosNetos,
        utilidadNeta: ingresos - gastosNetos,
        margen: ingresos > 0 ? ((ingresos - gastosNetos) / ingresos) * 100 : 0,
      };
      break;
    }
    case "FlujoEfectivo": {
      const cobrado = facturasEmitidas
        .filter((f) => f.estado === "pagada")
        .reduce((a, f) => a + Number(f.monto_total ?? 0), 0);
      const pagado = gastos
        .filter((g) => g.estado === "pagado")
        .reduce((a, g) => a + Number(g.monto_total ?? 0), 0);
      datos = { flujoOperaciones: cobrado - pagado, cobrado, pagado };
      break;
    }
    case "LibroCompras": {
      datos = { facturasRecibidas, gastos };
      break;
    }
    case "LibroVentas": {
      datos = { facturasEmitidas };
      break;
    }
    default:
      datos = { raw: { facturasEmitidas, facturasRecibidas, gastos } };
  }

  const { data, error } = await supabase
    .from("reportes")
    .insert({
      empresa_id: empresaId,
      tipo,
      nombre: `${tipo} — ${computedPeriodo}`,
      periodo: computedPeriodo,
      mes: computedMes,
      anio: computedAnio,
      datos: JSON.stringify(datos),
      estado: "completado",
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "reporte_create_failed", message: error.message }, 400);
  }

  return c.json({ ...data, datos }, 201);
});
