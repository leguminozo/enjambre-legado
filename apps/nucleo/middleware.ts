import { createAuthMiddleware } from "@enjambre/auth/middleware";
import {
  isPaymentReturnPath,
  normalizeReturnPath,
  parseProviderReturn,
} from "@enjambre/shop-chrome/provider-return";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Playwright CI: E2E_SKIP_AUTH=1 abre rutas sin sesión.
 * Nunca en Vercel production (aunque el env esté mal seteado).
 */
const e2eAuthSkipAllowed =
  process.env.E2E_SKIP_AUTH === "1" &&
  process.env.VERCEL_ENV !== "production";

const e2ePublicRoutes = e2eAuthSkipAllowed
  ? (["/sii", "/editor-tienda", "/estudio-rrss", "/estudio-audiovisual"] as const)
  : [];

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
    "/sw.js",
    "/maplibre-gl-worker.mjs",
    ...e2ePublicRoutes,
  ],
  // Trazabilidad escaneable sin sesión: destilaciones + pasaporte de frasco/lote +
  // landing del punto de venta (QR del pendón) + portal del dueño (auth dentro de la página).
  publicPathPrefixes: ["/alambique/", "/lote/", "/punto-de-venta/", "/municipalidades/", "/comuna/"],
  authRedirect: "/login",
  // Least privilege: missing app_metadata.role must not become admin.
  defaultRole: "cliente",
});

const PAYMENT_RETURN_MAX_BODY_BYTES = 64 * 1024;

async function handleProviderReturnPost(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (request.method !== "POST" || !isPaymentReturnPath(request.nextUrl.pathname)) {
    return null;
  }

  const target = request.nextUrl.clone();
  target.pathname = normalizeReturnPath(request.nextUrl.pathname);
  target.search = "";

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > PAYMENT_RETURN_MAX_BODY_BYTES) {
    target.searchParams.set("status", "failed");
    return NextResponse.redirect(target, 303);
  }

  let form: FormData | null = null;
  try {
    form = await request.formData();
  } catch {
    // Un body ilegible equivale a un retorno fallido, nunca a un 500.
  }

  const parsed = parseProviderReturn(form, request.nextUrl.searchParams);
  if (parsed.token) target.searchParams.set("token", parsed.token);
  if (parsed.buyOrder) target.searchParams.set("buyOrder", parsed.buyOrder);
  if (parsed.provider) target.searchParams.set("provider", parsed.provider);
  if (parsed.failed) target.searchParams.set("status", "failed");

  return NextResponse.redirect(target, 303);
}

export async function middleware(request: NextRequest) {
  const providerReturn = await handleProviderReturnPost(request);
  if (providerReturn) return providerReturn;
  return authMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon\\.ico|manifest\\.webmanifest|manifest\\.json|assets|icons|sw\\.js|maplibre-gl-worker\\.mjs).*)",
  ],
};
