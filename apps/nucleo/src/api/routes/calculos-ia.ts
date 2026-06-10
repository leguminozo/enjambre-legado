import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import { calcularPPM, calcularF29, F29_CODIGO, type EmpresaRegimen, type F29Input } from "@enjambre/contable";

export const calculosIARoutes = new Hono<{
  Variables: AppVariables;
}>();

calculosIARoutes.use("*", authMiddleware, tenantMiddleware);

calculosIARoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

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

calculosIARoutes.post("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const body = await c.req.json();

  const { tipo, parametros } = body;

  if (!tipo) {
    return c.json({ code: "validation_error", message: "tipo es requerido" }, 400);
  }

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

  const { data: periodos } = await supabase
    .from("periodos_contables")
    .select("*, facturas_emitidas(monto_neto, monto_iva, monto_total, tipo_documento), gastos(monto_neto, monto_iva, monto_total)")
    .eq("empresa_id", empresaId)
    .order("anio", { ascending: false })
    .order("mes", { ascending: false })
    .limit(12);

  const periodoActual = periodos?.[0];
  const facturasEmitidas = (periodoActual as Record<string, unknown>)?.facturas_emitidas as Record<string, unknown>[] ?? [];
  const gastosPeriodo = (periodoActual as Record<string, unknown>)?.gastos as Record<string, unknown>[] ?? [];

  const { data: empresa } = await supabase
    .from("empresas")
    .select("regimen, fecha_inicio_actividades, ingresos_brutos_anio_anterior")
    .eq("id", empresaId)
    .single();

  const empresaRegimen: EmpresaRegimen = {
    regimen: (empresa as Record<string, unknown>)?.regimen as EmpresaRegimen["regimen"] ?? "pro_pyme_transparente",
    fechaInicioActividades: (empresa as Record<string, unknown>)?.fecha_inicio_actividades as string ?? null,
    ingresosBrutosAnioAnterior: Number((empresa as Record<string, unknown>)?.ingresos_brutos_anio_anterior ?? 0),
  };

  switch (tipo) {
    case "ImpuestoMensual": {
      const ivaDebito = facturasEmitidas.reduce((a: number, f: Record<string, unknown>) => a + Number(f.monto_iva ?? 0), 0);
      const ivaCredito = gastosPeriodo.reduce((a: number, g: Record<string, unknown>) => a + Number(g.monto_iva ?? 0), 0);
      resultado = { ivaPagar: Math.max(0, ivaDebito - ivaCredito), ivaDebito, ivaCredito };
      break;
    }
    case "PPM": {
      const ingresosBrutos = facturasEmitidas.reduce((a: number, f: Record<string, unknown>) => a + Number(f.monto_total ?? 0), 0);
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
        .filter((f: Record<string, unknown>) => String(f.tipo_documento ?? "Factura") === "Factura")
        .reduce((a: number, f: Record<string, unknown>) => a + Number(f.monto_iva ?? 0), 0);
      const debitoBoletas = facturasEmitidas
        .filter((f: Record<string, unknown>) => ["Boleta", "Boleta Exenta"].includes(String(f.tipo_documento ?? "")))
        .reduce((a: number, f: Record<string, unknown>) => a + Number(f.monto_iva ?? 0), 0);
      const creditoCompras = gastosPeriodo.reduce((a: number, g: Record<string, unknown>) => a + Number(g.monto_iva ?? 0), 0);
      const ingresosBrutos = facturasEmitidas.reduce((a: number, f: Record<string, unknown>) => a + Number(f.monto_total ?? 0), 0);
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
      const ingresos = facturasEmitidas.reduce((a: number, f: Record<string, unknown>) => a + Number(f.monto_neto ?? 0), 0);
      const gastos = gastosPeriodo.reduce((a: number, g: Record<string, unknown>) => a + Number(g.monto_neto ?? 0), 0);
      resultado = { utilidadProyectada: ingresos - gastos, ingresos, gastos, margen: ingresos > 0 ? ((ingresos - gastos) / ingresos) * 100 : 0 };
      break;
    }
    case "OptimizacionFiscal": {
      resultado = { recomendaciones: ["Revisar deducciones disponibles", "Evaluar régimen tributario"], ahorroEstimado: 0 };
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
