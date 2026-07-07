import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";

export const boletaDownloadRoutes = new Hono<{ Variables: AppVariables }>();

boletaDownloadRoutes.get("/:buyOrder/xml", async (c) => {
  const buyOrder = c.req.param("buyOrder");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("facturas_emitidas")
    .select("sii_xml")
    .eq("numero", `BWEB-${buyOrder}`)
    .single();

  if (error || !data || !data.sii_xml) {
    return c.json({ code: "not_found", message: "Boleta no encontrada o XML no disponible" }, 404);
  }

  // Devolver el XML nativo con los headers correspondientes
  return new Response(data.sii_xml, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Disposition": `attachment; filename="boleta-${buyOrder}.xml"`,
    },
  });
});
