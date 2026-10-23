import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";

export const boletaDownloadRoutes = new Hono<{ Variables: AppVariables }>();

boletaDownloadRoutes.get("/:buyOrder/xml", async (c) => {
  const buyOrder = c.req.param("buyOrder");
  const supabase = c.get("supabase");

  const { data: venta } = await supabase
    .from("ventas")
    .select("id")
    .eq("buy_order", buyOrder)
    .maybeSingle();

  if (!venta) {
    return c.json({ code: "not_found", message: "Boleta no encontrada o XML no disponible" }, 404);
  }

  const byVenta = await supabase
    .from("facturas_emitidas")
    .select("sii_xml")
    .eq("venta_id", venta.id)
    .maybeSingle();

  // Fallback legacy: la fila por venta_id puede existir aún sin XML (emisión en
  // curso) mientras la fila original por idempotency_key ya lo tiene.
  let xml = byVenta.data?.sii_xml ?? null;
  if (!xml) {
    const byKey = await supabase
      .from("facturas_emitidas")
      .select("sii_xml")
      .eq("idempotency_key", `venta:${venta.id}`)
      .maybeSingle();
    xml = byKey.data?.sii_xml ?? null;
  }

  if (!xml) {
    return c.json({ code: "not_found", message: "Boleta no encontrada o XML no disponible" }, 404);
  }

  // Devolver el XML nativo con los headers correspondientes
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Disposition": `attachment; filename="boleta-${buyOrder}.xml"`,
    },
  });
});
