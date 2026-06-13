import { Hono } from "hono";
import {
  calcularF22,
  calcularF29,
  calcularPPM,
  fetchTasaUF,
} from "@enjambre/contable";
import type { F22Input, F29Input, EmpresaRegimen } from "@enjambre/contable";
import type { AppVariables } from "@/api/lib/middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

export const impuestosRoutes = new Hono<{ Variables: AppVariables }>();

export async function obtenerF29Interno(
  supabase: SupabaseClient,
  empresaId: string,
  anio: number,
  mes: number,
) {
  if (anio < 2000 || mes < 1 || mes > 12) {
    throw new Error("Anio o mes invalido");
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("regimen, fecha_inicio_actividades, ingresos_brutos_anio_anterior")
    .eq("id", empresaId)
    .single();

  if (!empresa) {
    throw new Error("Empresa no encontrada");
  }

  const { data: periodo } = await supabase
    .from("periodos_contables")
    .select("id, remanente_cf_anterior")
    .eq("empresa_id", empresaId)
    .eq("anio", anio)
    .eq("mes", mes)
    .maybeSingle();

  const [facturasRes, gastosRes, honorariosRes, gastosDigitalesRes] = await Promise.all([
    supabase
      .from("facturas_emitidas")
      .select("monto_neto, monto_iva, monto_total, tipo_documento")
      .eq("empresa_id", empresaId)
      .eq("periodo_id", periodo?.id ?? ""),
    supabase
      .from("gastos")
      .select("monto_iva")
      .eq("empresa_id", empresaId)
      .eq("periodo_id", periodo?.id ?? ""),
    supabase
      .from("honorarios")
      .select("monto_retencion")
      .eq("empresa_id", empresaId)
      .eq("periodo_id", periodo?.id ?? ""),
    supabase
      .from("facturas_compra")
      .select("monto_iva")
      .eq("empresa_id", empresaId)
      .eq("estado_sii", "aceptado")
      .eq("source_type", "manual")
      .gte("fecha_emision", `${anio}-${String(mes).padStart(2, "0")}-01`)
      .lt("fecha_emision", `${anio}-${String(mes + 1).padStart(2, "0")}-01`),
  ]);

  const facturas = (facturasRes.data ?? []) as Record<string, unknown>[];
  const gastos = (gastosRes.data ?? []) as Record<string, unknown>[];
  const honorarios = (honorariosRes.data ?? []) as Record<string, unknown>[];

  const debitoFacturas = facturas
    .filter((f) => String(f.tipo_documento ?? "Factura") === "Factura")
    .reduce((a, f) => a + Number(f.monto_iva ?? 0), 0);
  const debitoBoletas = facturas
    .filter((f) => ["Boleta", "Boleta Exenta"].includes(String(f.tipo_documento ?? "")))
    .reduce((a, f) => a + Number(f.monto_iva ?? 0), 0);
  const creditoCompras = gastos.reduce((a, g) => a + Number(g.monto_iva ?? 0), 0);
  const creditoDigital = (gastosDigitalesRes.data ?? []).reduce((a, g) => a + Number(g.monto_iva ?? 0), 0);
  const retencionHonorarios = honorarios.reduce((a, h) => a + Number(h.monto_retencion ?? 0), 0);
  const ingresosBrutos = facturas.reduce((a, f) => a + Number(f.monto_total ?? 0), 0);

  const empresaRegimen: EmpresaRegimen = {
    regimen: (empresa as Record<string, unknown>).regimen as EmpresaRegimen["regimen"] ?? "pro_pyme_transparente",
    fechaInicioActividades: (empresa as Record<string, unknown>).fecha_inicio_actividades as string ?? null,
    ingresosBrutosAnioAnterior: Number((empresa as Record<string, unknown>).ingresos_brutos_anio_anterior ?? 0),
  };

  let valorUF = 40766;
  try {
    valorUF = await fetchTasaUF();
  } catch { /* fallback hardcoded */ }

  const ppmResult = calcularPPM(empresaRegimen, ingresosBrutos, valorUF);

  const f29Input: F29Input = {
    debitoFacturas,
    debitoBoletasAfectas: debitoBoletas,
    debitoNotasDebito: 0,
    creditoFacturasNacionales: creditoCompras,
    creditoFacturaCompraDigital: creditoDigital,
    remanenteCFAnteriorReajustado: Number((periodo as Record<string, unknown>)?.remanente_cf_anterior ?? 0),
    retencionHonorarios,
    ppmBase: ppmResult.baseCalculo,
    ppmTasa: ppmResult.tasa,
    ppmMonto: ppmResult.monto,
  };

  return calcularF29(f29Input);
}

impuestosRoutes.get("/f29/:anio/:mes", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const anio = Number(c.req.param("anio"));
  const mes = Number(c.req.param("mes"));

  try {
    const f29 = await obtenerF29Interno(supabase, empresaId, anio, mes);
    return c.json({ data: f29 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error calculando F29";
    return c.json({ code: "f29_calc_failed", message }, 400);
  }
});

impuestosRoutes.post("/f29/:anio/:mes/guardar", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const anio = Number(c.req.param("anio"));
  const mes = Number(c.req.param("mes"));

  if (anio < 2000 || mes < 1 || mes > 12) {
    return c.json({ code: "invalid_period", message: "Anio o mes invalido" }, 400);
  }

  const { data: periodo } = await supabase
    .from("periodos_contables")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("anio", anio)
    .eq("mes", mes)
    .maybeSingle();

  if (!periodo) {
    return c.json({ code: "no_periodo", message: "No existe periodo contable para ese anio/mes" }, 404);
  }

  const periodoId = (periodo as Record<string, unknown>).id as string;

  const { data: existing } = await supabase
    .from("declaraciones_f29")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("anio", anio)
    .eq("mes", mes)
    .maybeSingle();

  if (existing) {
    const { error: delError } = await supabase
      .from("declaraciones_f29")
      .delete()
      .eq("id", (existing as Record<string, unknown>).id);
    if (delError) {
      return c.json({ code: "f29_delete_failed", message: delError.message }, 500);
    }
  }

  try {
    const f29Data = await obtenerF29Interno(supabase, empresaId, anio, mes);

    const { data, error } = await supabase
      .from("declaraciones_f29")
      .insert({
        empresa_id: empresaId,
        periodo_id: periodoId,
        anio,
        mes,
        lineas: f29Data,
        iva_pagar: Number(f29Data.ivaPagar ?? 0),
        remanente_proximo_periodo: Number(f29Data.remanenteProximoPeriodo ?? 0),
        ppm_determinado: Number(f29Data.ppmDeterminado ?? 0),
        total_pagar: Number(f29Data.ivaPagar ?? 0) + Number(f29Data.ppmDeterminado ?? 0),
        estado: "borrador",
      })
      .select("*")
      .single();

    if (error) {
      return c.json({ code: "f29_save_failed", message: error.message }, 500);
    }

    return c.json({ data }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error guardando F29";
    return c.json({ code: "f29_save_failed", message }, 400);
  }
});

impuestosRoutes.get("/f22/:anio", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const anio = Number(c.req.param("anio"));

  if (anio < 2000) {
    return c.json({ code: "invalid_anio", message: "Anio invalido" }, 400);
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("regimen, fecha_inicio_actividades, ingresos_brutos_anio_anterior")
    .eq("id", empresaId)
    .single();

  if (!empresa) {
    return c.json({ code: "empresa_not_found", message: "Empresa no encontrada" }, 404);
  }

  const { data: periodos } = await supabase
    .from("periodos_contables")
    .select("id, anio, mes")
    .eq("empresa_id", empresaId)
    .eq("anio", anio);

  if (!periodos || periodos.length === 0) {
    return c.json({ code: "no_data", message: `No hay periodos contables para ${anio}` }, 404);
  }

  const periodoIds = periodos.map((p: Record<string, unknown>) => String(p.id));

  const [facturasRes, honorariosRes, ppmRes] = await Promise.all([
    supabase
      .from("facturas_emitidas")
      .select("monto_neto, monto_iva, monto_total")
      .eq("empresa_id", empresaId)
      .in("periodo_id", periodoIds),
    supabase
      .from("honorarios")
      .select("monto_retencion")
      .eq("empresa_id", empresaId)
      .in("periodo_id", periodoIds),
    supabase
      .from("declaraciones_f29")
      .select("ppm_monto, iva_pagar")
      .eq("empresa_id", empresaId)
      .eq("anio", anio),
  ]);

  const facturas = (facturasRes.data ?? []) as Record<string, unknown>[];
  const honorarios = (honorariosRes.data ?? []) as Record<string, unknown>[];
  const ppmRows = (ppmRes.data ?? []) as Record<string, unknown>[];

  const baseImponible = facturas.reduce((a, f) => a + Number(f.monto_total ?? 0), 0);
  const ivaDebito = facturas.reduce((a, f) => a + Number(f.monto_iva ?? 0), 0);
  const retencionesTotal = honorarios.reduce((a, h) => a + Number(h.monto_retencion ?? 0), 0);
  const ppmTotalPagado = ppmRows.reduce((a, p) => a + Number(p.ppm_monto ?? 0), 0);

  const empresaRegimen = (empresa as Record<string, unknown>).regimen as import("@enjambre/contable").RegimenTributario ?? "pro_pyme_transparente";

  const f22Input: F22Input = {
    anioComercial: anio,
    regimen: empresaRegimen,
    baseImponibleTransparente: baseImponible,
    idpcPagada: 0,
    ppmTotalPagado,
    retencionesHonorariosTotal: retencionesTotal,
    ivaDebitoAnual: ivaDebito,
    ivaCreditoAnual: 0,
  };

  const f22 = calcularF22(f22Input);

  return c.json({ data: f22 });
});
