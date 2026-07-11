import { createAuthMiddleware } from "@enjambre/auth/middleware";

/** Rutas abiertas solo en Playwright (E2E_SKIP_AUTH=1). Nunca en prod real. */
const e2ePublicRoutes =
  process.env.E2E_SKIP_AUTH === "1"
    ? (["/sii", "/editor-tienda"] as const)
    : [];

export const middleware = createAuthMiddleware({
  publicRoutes: ["/", "/login", ...e2ePublicRoutes],
  authRedirect: "/login",
  defaultRole: "admin",
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|assets|icons).*)",
  ],
};
