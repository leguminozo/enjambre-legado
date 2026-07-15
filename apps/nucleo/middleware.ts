import { createAuthMiddleware } from "@enjambre/auth/middleware";

/**
 * Playwright CI: E2E_SKIP_AUTH=1 abre rutas sin sesión.
 * Nunca en Vercel production (aunque el env esté mal seteado).
 */
const e2eAuthSkipAllowed =
  process.env.E2E_SKIP_AUTH === "1" &&
  process.env.VERCEL_ENV !== "production";

const e2ePublicRoutes = e2eAuthSkipAllowed
  ? (["/sii", "/editor-tienda"] as const)
  : [];

export const middleware = createAuthMiddleware({
  publicRoutes: ["/", "/login", ...e2ePublicRoutes],
  authRedirect: "/login",
  // Least privilege: missing app_metadata.role must not become admin.
  defaultRole: "cliente",
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|assets|icons).*)",
  ],
};
