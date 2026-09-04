import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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

/** Alias públicos SEO / bookmarks incorrectos → rutas canónicas. */
const PUBLIC_ALIASES: Record<string, string> = {
  "/planes": "/planes-territoriales",
  "/mapa-publico": "/mapa-chiloe",
};

const authMiddleware = createAuthMiddleware({
  publicRoutes: [
    "/",
    "/login",
    "/reset-password",
    "/auth/callback",
    "/carta",
    "/privacidad",
    "/terminos",
    "/mapa-chiloe",
    "/planes-territoriales",
    "/municipalidades",
    "/comuna",
    // Crawlers: Next.js app/robots.ts + sitemap.ts
    "/robots.txt",
    "/sitemap.xml",
    ...e2ePublicRoutes,
  ],
  // Trazabilidad escaneable sin sesión: destilaciones + pasaporte de frasco/lote +
  // landing del punto de venta (QR del pendón) + portal del dueño (auth dentro de la página).
  publicPathPrefixes: ["/alambique/", "/lote/", "/punto-de-venta/", "/municipalidades/", "/comuna/"],
  authRedirect: "/login",
  // Least privilege: missing app_metadata.role must not become admin.
  defaultRole: "cliente",
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const alias = PUBLIC_ALIASES[pathname];
  if (alias) {
    const url = request.nextUrl.clone();
    url.pathname = alias;
    return NextResponse.redirect(url, 308);
  }

  const response = await authMiddleware(request);

  // /mapa es admin (Mapa del Legado). Anónimos que caen en /login deben ir al mapa público.
  if (
    pathname === "/mapa" &&
    response.status >= 300 &&
    response.status < 400
  ) {
    const location = response.headers.get("location") ?? "";
    if (location.includes("/login")) {
      const url = request.nextUrl.clone();
      url.pathname = "/mapa-chiloe";
      return NextResponse.redirect(url, 308);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Excluir robots/sitemap del matcher además de publicRoutes (cinturón + tirantes).
    "/((?!_next/static|_next/image|_next/data|favicon.ico|manifest\\.webmanifest|manifest\\.json|assets|icons|robots\\.txt|sitemap\\.xml).*)",
  ],
};
