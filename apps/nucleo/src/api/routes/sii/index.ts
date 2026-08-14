import { Hono } from "hono";
import { fetchTasaDolar, fetchTasaEuro, fetchTasaUF } from "@enjambre/contable";
import { authMiddleware, requireProfileRole, tenantMiddleware } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";

import { empresaRoutes } from "./empresa";
import { facturasRoutes } from "./facturas";
import { gastosRoutes } from "./gastos";
import { impuestosRoutes } from "./impuestos";
import { honorariosRoutes } from "./honorarios";
import { rcvRoutes } from "./rcv";
import { dteRoutes } from "./dte";
import { openapiRoutes } from "./openapi";
import { certificacionRoutes } from "./certificacion";
import { trazabilidadRoutes } from "./trazabilidad";
import { boletaDownloadRoutes } from "./boleta-download";
import { certificadosRoutes } from "./certificados";
import { cafRoutes } from "./caf";
import { jobsRoutes } from "./jobs";
import { rpetcRoutes } from "./rpetc";
import { intercambioRoutes } from "./intercambio";

export const siiRoutes = new Hono<{ Variables: AppVariables }>();

siiRoutes.use("*", authMiddleware, tenantMiddleware);

// Auditoría 2026-08-14 (C-4): la emisión de DTE y la gestión fiscal son
// operaciones de admin. Antes, cualquier miembro del tenant (reps/cajeros)
// podía emitir DTEs timbrados al SII con montos/RUT arbitrarios y quemar
// folios CAF. /boletas (descarga de clientes), /openapi (docs) y
// /trazabilidad (sin consumidores) quedan fuera del gate.
siiRoutes.use("/dte/*", requireProfileRole("admin"));
siiRoutes.use("/certificacion/*", requireProfileRole("admin"));
siiRoutes.use("/caf/*", requireProfileRole("admin"));
siiRoutes.use("/jobs/*", requireProfileRole("admin"));
siiRoutes.use("/facturas-compra/*", requireProfileRole("admin"));
siiRoutes.use("/gastos-extranjero/*", requireProfileRole("admin"));
siiRoutes.use("/honorarios/*", requireProfileRole("admin"));
siiRoutes.use("/rcv/*", requireProfileRole("admin"));
siiRoutes.use("/f29/*", requireProfileRole("admin"));
siiRoutes.use("/f22/*", requireProfileRole("admin"));
siiRoutes.use("/certificados/*", requireProfileRole("admin"));
siiRoutes.use("/rpetc/*", requireProfileRole("admin"));
siiRoutes.use("/intercambio/*", requireProfileRole("admin"));
siiRoutes.use("/empresa/*", requireProfileRole("admin"));
siiRoutes.use("/dashboard", requireProfileRole("admin"));
siiRoutes.use("/tasa-cambio", requireProfileRole("admin"));

siiRoutes.route("/empresa", empresaRoutes);
siiRoutes.route("/facturas-compra", facturasRoutes);
siiRoutes.route("/gastos-extranjero", gastosRoutes);
siiRoutes.route("/", impuestosRoutes); // Handles /f29/... and /f22/...
siiRoutes.route("/honorarios", honorariosRoutes);
siiRoutes.route("/rcv", rcvRoutes);
siiRoutes.route("/dte", dteRoutes);
siiRoutes.route("/openapi", openapiRoutes);
siiRoutes.route("/certificacion", certificacionRoutes);
siiRoutes.route("/trazabilidad", trazabilidadRoutes);
siiRoutes.route("/boletas", boletaDownloadRoutes);
siiRoutes.route("/certificados", certificadosRoutes);
siiRoutes.route("/caf", cafRoutes);
siiRoutes.route("/jobs", jobsRoutes);
siiRoutes.route("/rpetc", rpetcRoutes);
siiRoutes.route("/intercambio", intercambioRoutes);

siiRoutes.get("/tasa-cambio", async (c) => {
  const moneda = c.req.query("moneda") ?? "dolar";

  try {
    if (moneda === "dolar") {
      const valor = await fetchTasaDolar();
      return c.json({ data: { moneda: "USD", valor, fecha: new Date().toISOString().slice(0, 10) } });
    }
    if (moneda === "euro") {
      const valor = await fetchTasaEuro();
      return c.json({ data: { moneda: "EUR", valor, fecha: new Date().toISOString().slice(0, 10) } });
    }
    if (moneda === "uf") {
      const valor = await fetchTasaUF();
      return c.json({ data: { moneda: "UF", valor, fecha: new Date().toISOString().slice(0, 10) } });
    }
    return c.json({ code: "unsupported_currency", message: "Moneda no soportada. Usa: dolar, euro, uf" }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error obteniendo tasa";
    return c.json({ code: "tasa_cambio_failed", message }, 502);
  }
});

// GET/POST /caf* → cafRoutes (list, import-xml, activate)

siiRoutes.get("/dashboard", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const [comprasRes, pendientesRes] = await Promise.all([
    supabase
      .from("facturas_compra")
      .select("monto_neto, monto_iva, monto_total")
      .eq("empresa_id", empresaId),
    supabase
      .from("facturas_compra")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("estado_sii", "pendiente"),
  ]);

  if (comprasRes.error) {
    return c.json(
      { code: "sii_dashboard_failed", message: comprasRes.error.message },
      500,
    );
  }

  const compras = comprasRes.data ?? [];
  const totalComprasNeto = compras.reduce(
    (acc: number, item: { monto_neto: number | null }) =>
      acc + Number(item.monto_neto ?? 0),
    0,
  );
  const totalComprasIva = compras.reduce(
    (acc: number, item: { monto_iva: number | null }) =>
      acc + Number(item.monto_iva ?? 0),
    0,
  );
  const totalCompras = compras.reduce(
    (acc: number, item: { monto_total: number | null }) =>
      acc + Number(item.monto_total ?? 0),
    0,
  );

  return c.json({
    data: {
      totalComprasNeto,
      totalComprasIva,
      totalCompras,
      totalFacturasCompra: compras.length,
      pendientesEnvio: pendientesRes.data?.length ?? 0,
    },
  });
});
