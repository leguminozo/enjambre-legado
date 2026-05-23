import { Hono } from "hono";
import { handle } from "hono/vercel";
import type { AppVariables } from "@/api/lib/middleware";
import { healthRoutes } from "@/api/routes/health";
import { contableRoutes } from "@/api/routes/contable";
import { creadoresRoutes } from "@/api/routes/creadores";
import { bancoChileRoutes } from "@/api/routes/banco-chile";
import { sumupRoutes } from "@/api/routes/sumup";
import { siiRoutes } from "@/api/routes/sii";
import { facturasEmitidasRoutes } from "@/api/routes/facturas-emitidas";
import { gastosRoutes } from "@/api/routes/gastos";
import { tercerosRoutes } from "@/api/routes/terceros";
import { dashboardRoutes } from "@/api/routes/eirl-dashboard";
import { reportesRoutes } from "@/api/routes/reportes";
import { calculosIARoutes } from "@/api/routes/calculos-ia";

export type { AppVariables };

const app = new Hono<{ Variables: AppVariables }>().basePath("/api");

app.route("/health", healthRoutes);
app.route("/contable", contableRoutes);
app.route("/creadores", creadoresRoutes);
app.route("/banco-chile", bancoChileRoutes);
app.route("/sumup", sumupRoutes);
app.route("/sii", siiRoutes);
app.route("/facturas-emitidas", facturasEmitidasRoutes);
app.route("/gastos", gastosRoutes);
app.route("/terceros", tercerosRoutes);
app.route("/eirl-dashboard", dashboardRoutes);
app.route("/reportes", reportesRoutes);
app.route("/calculos-ia", calculosIARoutes);

app.onError((err, c) => {
  console.error(err);
  return c.json({ code: "internal_error", message: "Unexpected error" }, 500);
});

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
