import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import { calcularPPM, calcularF29, type EmpresaRegimen, type F29Input } from "@enjambre/contable";
import type { Database } from "@enjambre/database/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const calculosIARoutes = new Hono<{
  Variables: AppVariables;
}>();

calculosIARoutes.use("*", authMiddleware, tenantMiddleware);

calculosIARoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase") as unknown as SupabaseClient<Database>;

  const { data, error } = await supabase
    .from("calculos_ia")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json(data ?? []);
});

const calculoIASchema = z.object({
  tipo: z.enum(["ImpuestoMensual", "PPM", "F29", "ProyeccionUtilidad", "OptimizacionFiscal"]),
  parametros: z.union([z.record(z.string(), z.unknown()), z.string()]).optional(),
});

calculosIARoutes.post("/", zValidator("json", calculoIASchema), async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase") as unknown as SupabaseClient<Database>;
  const { tipo, parametros } = c.req.valid("json");

  const { data: calculo, error: insertError } = await supabase
    .from("calculos_ia")
    .insert({
      empresa_id: empresaId,
      tipo,
      parametros: typeof parametros === "string" ? parametros : JSON.stringify(parametros),
      resultado: "{}",
      estado: "Procesando",
    })
    .select("*")
    .single();

  if (insertError) {
    return c.json({ code: "calculo_create_failed", message: insertError.message }, 400);
  }

  try {
    let resultado: Record<string, unknown> = {};

    const { data: periodos } = await (supabase as any)
      .from("periodos_contables")
      .select(`
        id,
        anio,
        mes,
        facturas_emitidas (
          monto_neto,
          monto_iva,
          monto_total,
          tipo_documento
        ),
        gastos (
          monto_neto,
          monto_iva,
          monto_total
        )
      `)
      .eq("empresa_id", empresaId)
      .order("anio", { ascending: false })
      .order("mes", { ascending: false })
      .limit(12);

    const periodoActual = periodos?.[0] as any;
    const facturasEmitidas = (periodoActual?.facturas_emitidas ?? []) as Array<
      Database["public"]["Tables"]["facturas_emitidas"]["Row"]
    >;
    const gastosPeriodo = (periodoActual?.gastos ?? []) as Array<
      Database["public"]["Tables"]["gastos"]["Row"]
    >;

    const { data: empresa } = await (supabase as any)
      .from("empresas")
      .select("regimen, fecha_inicio_actividades, ingresos_brutos_anio_anterior")
      .eq("id", empresaId)
      .single();

    const empresaRegimen: EmpresaRegimen = {
      regimen: ((empresa as any)?.regimen as EmpresaRegimen["regimen"]) ?? "pro_pyme_transparente",
      fechaInicioActividades: (empresa as any)?.fecha_inicio_actividades ?? null,
      ingresosBrutosAnioAnterior: Number((empresa as any)?.ingresos_brutos_anio_anterior ?? 0),
    };

    switch (tipo) {
      case "ImpuestoMensual": {
        const ivaDebito = facturasEmitidas.reduce((a, f) => a + Number(f.monto_iva ?? 0), 0);
        const ivaCredito = gastosPeriodo.reduce((a, g) => a + Number(g.monto_iva ?? 0), 0);
        resultado = { ivaPagar: Math.max(0, ivaDebito - ivaCredito), ivaDebito, ivaCredito };
        break;
      }
      case "PPM": {
        const ingresosBrutos = facturasEmitidas.reduce((a, f) => a + Number(f.monto_total ?? 0), 0);
        const valorUF = 40766;
        const ppmResult = calcularPPM(empresaRegimen, ingresosBrutos, valorUF);
        resultado = {
          ppmBase: ppmResult.baseCalculo,
          ppmMonto: ppmResult.monto,
          tasa: ppmResult.tasa,
          tasaBase: ppmResult.tasaBase,
          esAnioInicio: ppmResult.esAnioInicio,
          aplicaRebaja50: ppmResult.aplicaRebaja50,
          regimen: empresaRegimen.regimen,
        };
        break;
      }
      case "F29": {
        const debitoFacturas = facturasEmitidas
          .filter((f) => String(f.tipo_documento ?? "Factura") === "Factura")
          .reduce((a, f) => a + Number(f.monto_iva ?? 0), 0);
        const debitoBoletas = facturasEmitidas
          .filter((f) => ["Boleta", "Boleta Exenta"].includes(String(f.tipo_documento ?? "")))
          .reduce((a, f) => a + Number(f.monto_iva ?? 0), 0);
        const creditoCompras = gastosPeriodo.reduce((a, g) => a + Number(g.monto_iva ?? 0), 0);
        const ingresosBrutos = facturasEmitidas.reduce((a, f) => a + Number(f.monto_total ?? 0), 0);
        const valorUF = 40766;
        const ppmResult = calcularPPM(empresaRegimen, ingresosBrutos, valorUF);

        const f29Input: F29Input = {
          debitoFacturas,
          debitoBoletasAfectas: debitoBoletas,
          debitoNotasDebito: 0,
          creditoFacturasNacionales: creditoCompras,
          creditoFacturaCompraDigital: 0,
          remanenteCFAnteriorReajustado: 0,
          retencionHonorarios: 0,
          ppmBase: ppmResult.baseCalculo,
          ppmTasa: ppmResult.tasa,
          ppmMonto: ppmResult.monto,
        };

        const f29 = calcularF29(f29Input);
        resultado = { f29 };
        break;
      }
      case "ProyeccionUtilidad": {
        const ingresos = facturasEmitidas.reduce((a, f) => a + Number(f.monto_neto ?? 0), 0);
        const gastos = gastosPeriodo.reduce((a, g) => a + Number(g.monto_neto ?? 0), 0);
        resultado = {
          utilidadProyectada: ingresos - gastos,
          ingresos,
          gastos,
          margen: ingresos > 0 ? ((ingresos - gastos) / ingresos) * 100 : 0,
        };
        break;
      }
      case "OptimizacionFiscal": {
        resultado = {
          recomendaciones: ["Revisar deducciones disponibles", "Evaluar régimen tributario"],
          ahorroEstimado: 0,
        };
        break;
      }
      default:
        resultado = { message: "Tipo no reconocido" };
    }

    await supabase
      .from("calculos_ia")
      .update({ resultado: JSON.stringify(resultado), estado: "Completado" })
      .eq("id", calculo.id);

    return c.json({ ...calculo, resultado, estado: "Completado" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("calculos_ia")
      .update({ estado: "Error", error: message })
      .eq("id", calculo.id);

    return c.json({ code: "calculo_failed", message }, 500);
  }
});
