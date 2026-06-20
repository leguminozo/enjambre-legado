import { createAuthMiddleware } from "@enjambre/auth/middleware";

const e2ePublicRoutes =
  process.env.E2E_SKIP_AUTH === "1" ? ["/sii"] as const : [];

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
