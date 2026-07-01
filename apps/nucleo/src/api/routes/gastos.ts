import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import { calcularIVA, calcularNetoDesdeTotal } from "@enjambre/contable";

const CreateGastoSchema = z.strictObject({
  fecha: z.string().min(1),
  descripcion: z.string().min(1),
  monto: z.number().positive(),
  montoIva: z.number().nonnegative().optional(),
  montoNeto: z.number().nonnegative().optional(),
  incluyeIva: z.boolean().default(true),
  categoria: z.string().min(1),
  tipoComprobante: z.enum(["Boleta", "Factura", "Nota de Crédito", "Otro"]).default("Boleta"),
  numeroComprobante: z.string().optional(),
  proveedorId: z.string().uuid().optional(),
  estado: z.enum(["pendiente", "pagado", "anulado"]).default("pendiente"),
});

export const gastosRoutes = new Hono<{
  Variables: AppVariables;
}>();

gastosRoutes.use("*", authMiddleware, tenantMiddleware);

gastosRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const periodoId = c.req.query("periodoId");

  let query = supabase
    .from("gastos")
    .select("*, proveedor:terceros!gastos_tercero_id_fkey(id, nombre, rut), periodo:periodos_contables(nombre)")
    .eq("empresa_id", empresaId)
    .order("fecha", { ascending: false });

  if (periodoId) {
    query = query.eq("periodo_id", periodoId);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json(data ?? []);
});

gastosRoutes.post("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const parsed = CreateGastoSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: "validation_error", errors: parsed.error.flatten() }, 400);
  const body = parsed.data;

  let computedNeto: number;
  let computedIva: number;

  if (body.montoIva !== undefined && body.montoNeto !== undefined) {
    computedNeto = body.montoNeto;
    computedIva = body.montoIva;
  } else if (body.incluyeIva) {
    computedNeto = body.montoNeto ?? calcularNetoDesdeTotal(body.monto);
    computedIva = body.montoIva ?? calcularIVA(computedNeto);
  } else {
    computedNeto = body.montoNeto ?? body.monto;
    computedIva = body.montoIva ?? calcularIVA(computedNeto);
  }

  const fechaDate = new Date(body.fecha);
  const mes = fechaDate.getMonth() + 1;
  const anio = fechaDate.getFullYear();

  let { data: periodo } = await supabase
    .from("periodos_contables")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("mes", mes)
    .eq("anio", anio)
    .maybeSingle();

  if (!periodo) {
    const { data: newPeriodo } = await supabase
      .from("periodos_contables")
      .insert({
        empresa_id: empresaId, mes, anio, estado: "abierto",
        ingresos_netos: 0, egresos_netos: 0, utilidad_bruta: 0,
        utilidad_neta: 0, iva_debito: 0, iva_credito: 0, iva_pagar: 0, ppm_calculado: 0,
      })
      .select("id")
      .single();
    periodo = newPeriodo;
  }

  const payload = {
    empresa_id: empresaId,
    tercero_id: body.proveedorId ?? null,
    periodo_id: periodo?.id,
    fecha: body.fecha,
    descripcion: body.descripcion,
    monto: body.monto,
    monto_total: body.monto,
    monto_iva: computedIva,
    monto_neto: computedNeto,
    categoria: body.categoria,
    tipo_comprobante: body.tipoComprobante,
    numero_comprobante: body.numeroComprobante ?? null,
    estado: body.estado,
  };

  const { data, error } = await supabase
    .from("gastos")
    .insert(payload)
    .select("*, proveedor:terceros!gastos_tercero_id_fkey(id, nombre, rut), periodo:periodos_contables(nombre)")
    .single();

  if (error) {
    return c.json({ code: "gasto_create_failed", message: error.message }, 400);
  }

  return c.json(data, 201);
});

const UpdateGastoSchema = CreateGastoSchema.partial().extend({
  descripcion: z.string().min(1).optional(),
  monto: z.number().positive().optional(),
  categoria: z.string().min(1).optional(),
});

gastosRoutes.patch("/:id", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const id = c.req.param("id");
  const parsed = UpdateGastoSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: "validation_error", errors: parsed.error.flatten() }, 400);
  const body = parsed.data;

  type GastoPatch = {
    fecha?: string;
    descripcion?: string;
    categoria?: string;
    tipo_comprobante?: string;
    numero_comprobante?: string | null;
    tercero_id?: string | null;
    estado?: string;
    monto?: number;
    monto_total?: number;
    monto_neto?: number;
    monto_iva?: number;
  };

  const patch: GastoPatch = {};
  if (body.fecha !== undefined) patch.fecha = body.fecha;
  if (body.descripcion !== undefined) patch.descripcion = body.descripcion;
  if (body.categoria !== undefined) patch.categoria = body.categoria;
  if (body.tipoComprobante !== undefined) patch.tipo_comprobante = body.tipoComprobante;
  if (body.numeroComprobante !== undefined) patch.numero_comprobante = body.numeroComprobante ?? null;
  if (body.proveedorId !== undefined) patch.tercero_id = body.proveedorId ?? null;
  if (body.estado !== undefined) patch.estado = body.estado;

  if (body.monto !== undefined) {
    let computedNeto: number;
    let computedIva: number;
    if (body.montoIva !== undefined && body.montoNeto !== undefined) {
      computedNeto = body.montoNeto;
      computedIva = body.montoIva;
    } else if (body.incluyeIva !== false) {
      computedNeto = body.montoNeto ?? calcularNetoDesdeTotal(body.monto);
      computedIva = body.montoIva ?? calcularIVA(computedNeto);
    } else {
      computedNeto = body.montoNeto ?? body.monto;
      computedIva = body.montoIva ?? calcularIVA(computedNeto);
    }
    patch.monto = body.monto;
    patch.monto_total = body.monto;
    patch.monto_neto = computedNeto;
    patch.monto_iva = computedIva;
  }

  const { data, error } = await supabase
    .from("gastos")
    .update(patch)
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .select("*, proveedor:terceros!gastos_tercero_id_fkey(id, nombre, rut), periodo:periodos_contables(nombre)")
    .single();

  if (error) {
    return c.json({ code: "gasto_update_failed", message: error.message }, 400);
  }

  return c.json(data);
});

gastosRoutes.delete("/:id", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const id = c.req.param("id");

  const { error } = await supabase
    .from("gastos")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) {
    return c.json({ code: "gasto_delete_failed", message: error.message }, 400);
  }

  return c.json({ success: true });
});
