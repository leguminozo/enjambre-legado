import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";

export const trazabilidadRoutes = new Hono<{ Variables: AppVariables }>();

trazabilidadRoutes.get("/:codigo", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const codigo = c.req.param("codigo");

  const { data: qr, error: qrError } = await supabase
    .from("qr_codes")
    .select("id, codigo, lote_id, producto_id, fecha_produccion, apiario_id")
    .eq("empresa_id", empresaId)
    .eq("codigo", codigo)
    .eq("activo", true)
    .maybeSingle();

  if (qrError || !qr) {
    return c.json({ code: "qr_not_found", message: "Código QR no encontrado" }, 404);
  }

  const { data: scanEvent } = await supabase
    .from("qr_audit_trail")
    .select("metadata")
    .eq("qr_id", qr.id)
    .eq("evento", "entregado")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ventaId = (scanEvent?.metadata as { venta_id?: string } | null)?.venta_id ?? null;

  let venta: Record<string, unknown> | null = null;
  let dte: Record<string, unknown> | null = null;

  if (ventaId) {
    const { data: ventaRow } = await supabase
      .from("ventas")
      .select("id, total, estado, created_at")
      .eq("id", ventaId)
      .eq("empresa_id", empresaId)
      .maybeSingle();

    venta = ventaRow as Record<string, unknown> | null;
  }

  if (venta) {
    const { data: emitidas } = await supabase
      .from("facturas_emitidas")
      .select("id, numero, monto_total, monto_iva, estado, fecha_emision")
      .eq("empresa_id", empresaId)
      .gte("created_at", String(venta.created_at ?? "").slice(0, 10))
      .order("created_at", { ascending: false })
      .limit(3);

    dte =
      emitidas?.find((e) => Number(e.monto_total) === Number(venta.total)) ??
      emitidas?.[0] ??
      null;
  }

  const { data: eventos } = await supabase
    .from("qr_audit_trail")
    .select("evento, ubicacion, created_at")
    .eq("qr_id", qr.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return c.json({
    data: {
      qr: {
        codigo: qr.codigo,
        loteId: qr.lote_id,
        productoId: qr.producto_id,
        fechaProduccion: qr.fecha_produccion,
        apiarioId: qr.apiario_id,
      },
      venta,
      dte,
      eventos: eventos ?? [],
    },
  });
});