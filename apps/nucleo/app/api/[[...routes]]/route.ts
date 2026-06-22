import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { type AppVariables, csrfMiddleware } from "@/api/lib/middleware";
import { getInternalApiSecret, verifyInternalApiKey } from "@enjambre/auth/internal-api-secret";
import { rateLimit, getIdentifierFromRequest } from "@/api/lib/rate-limit";
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
import { cashSessionsRoutes } from "@/api/routes/cash-sessions";
import { repVentasRoutes } from "@/api/routes/rep-ventas";
import { invitationsRoutes } from "@/api/routes/invitations";
import { commissionRulesRoutes } from "@/api/routes/commission-rules";
import { dashboardResumenRoutes } from "@/api/routes/dashboard-resumen";
import { dashboardEjecutivoRoutes } from "@/api/routes/dashboard-ejecutivo";
import { costeoRoutes } from "@/api/routes/costeo";
import { cmsRoutes } from "@/api/routes/cms";
import { logisticaRoutes } from "@/api/routes/logistica";
import { produccionRoutes } from "@/api/routes/produccion";
import { crmRoutes } from "@/api/routes/crm";
import { pipelineRoutes } from "@/api/routes/pipeline";
import { securityEventRoutes } from "@/api/routes/security-events";
import { checkoutRoutes } from "@/api/routes/checkout";
import { subscriptionsCheckoutRoutes } from "@/api/routes/subscriptions-checkout";
import { webhooksApp } from "@/api/routes/webhooks";
import { notificationsRoutes } from "@/api/routes/notifications";
import { resenasRoutes } from "@/api/routes/resenas";
import { walletRoutes } from "@/api/routes/wallet";
import { ritualRoutes } from "@/api/routes/ritual";

export type { AppVariables };

export const app = new Hono<{ Variables: AppVariables }>().basePath("/api");

app.use("*", cors({
  origin: (origin) => {
    const allowed = [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NEXT_PUBLIC_TIENDA_URL,
      process.env.NEXT_PUBLIC_CAMPO_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ].filter(Boolean) as string[];

    return allowed.includes(origin) ? origin : null;
  },
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-empresa-id", "x-internal-key"],
  credentials: true,
}));

app.use("*", csrfMiddleware);

app.use("*", async (c, next) => {
  const path = new URL(c.req.url).pathname;
  
  const strictPaths = [
    "/api/checkout",
    "/api/security-events",
    "/api/cash-sessions",
    "/api/rep-ventas",
  ];
  
  const standardPaths = [
    "/api/contable",
    "/api/banco-chile",
    "/api/sii",
    "/api/facturas-emitidas",
    "/api/gastos",
    "/api/terceros",
    "/api/eirl-dashboard",
    "/api/reportes",
    "/api/calculos-ia",
    "/api/commission-rules",
    "/api/dashboard/resumen",
    "/api/dashboard/ejecutivo",
    "/api/costeo",
    "/api/cms",
    "/api/logistica",
    "/api/produccion",
    "/api/crm",
  ];
  
  const limit = strictPaths.some(p => path.startsWith(p))
    ? rateLimit({ windowMs: 60000, maxRequests: 20 })
    : standardPaths.some(p => path.startsWith(p))
    ? rateLimit({ windowMs: 60000, maxRequests: 100 })
    : rateLimit({ windowMs: 60000, maxRequests: 200 });
  
  const identifier = getIdentifierFromRequest(c);
  const result = limit(identifier);
  
  if (!result.success) {
    c.header("X-RateLimit-Limit", strictPaths.some(p => path.startsWith(p)) ? "20" : standardPaths.some(p => path.startsWith(p)) ? "100" : "200");
    c.header("X-RateLimit-Remaining", "0");
    c.header("X-RateLimit-Reset", new Date(result.resetTime).toISOString());

    if (strictPaths.some(p => path.startsWith(p))) {
      try {
        const origin = new URL(c.req.url).origin;
        const internalKey = getInternalApiSecret();
        fetch(`${origin}/api/security-events/internal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(internalKey ? { "x-internal-key": internalKey } : {}),
          },
          body: JSON.stringify({
            eventType: "suspicious_activity",
            email: "rate-limit@enjambre.local",
            details: {
              path,
              ip: identifier,
              reason: "Rate limit exceeded on strict path",
            },
            appSource: "nucleo-bff",
          }),
        }).catch(() => {});
      } catch (err) {
        console.error("[rate-limit-alert] Failed to trigger security event:", err);
      }
    }

    return c.json({ code: "rate_limit_exceeded", message: "Too many requests" }, 429);
  }
  
  c.header("X-RateLimit-Limit", result.success ? "200" : "20");
  c.header("X-RateLimit-Remaining", result.remaining.toString());
  c.header("X-RateLimit-Reset", new Date(result.resetTime).toISOString());
  
  return next();
});

app.use("*", async (c, next) => {
  const publicPaths = [
    "/api/health",
    "/api/checkout",
    "/api/security-events",
    "/api/creadores",
    "/api/invitations",
    "/api/webhooks",
    "/api/resenas",
    "/api/wallet",
  ];
  const path = new URL(c.req.url).pathname;

  if (publicPaths.some((p) => path.startsWith(p))) {
    return next();
  }

  if (path.startsWith("/api/notifications/internal") || path.startsWith("/api/ritual/cron")) {
    if (verifyInternalApiKey(c.req.header("x-internal-key"))) {
      return next();
    }
    return c.json({ code: "unauthorized", message: "Invalid internal key" }, 401);
  }

  const authHeader = c.req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ code: "unauthorized", message: "Global fallback: Missing token" }, 401);
  }

  return next();
});

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
app.route("/cash-sessions", cashSessionsRoutes);
app.route("/rep-ventas", repVentasRoutes);
app.route("/invitations", invitationsRoutes);
app.route("/commission-rules", commissionRulesRoutes);
app.route("/dashboard/resumen", dashboardResumenRoutes);
app.route("/dashboard/ejecutivo", dashboardEjecutivoRoutes);
app.route("/costeo", costeoRoutes);
app.route("/cms", cmsRoutes);
app.route("/logistica", logisticaRoutes);
app.route("/produccion", produccionRoutes);
app.route("/crm", crmRoutes);
app.route("/pipeline", pipelineRoutes);
app.route("/security-events", securityEventRoutes);
app.route("/checkout", checkoutRoutes);
app.route("/subscriptions/checkout", subscriptionsCheckoutRoutes);
app.route("/webhooks", webhooksApp);
app.route("/notifications", notificationsRoutes);
app.route("/resenas", resenasRoutes);
app.route("/wallet", walletRoutes);
app.route("/ritual", ritualRoutes);

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
