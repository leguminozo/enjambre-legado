/**
 * Pure go-live status for web checkout (Flow / Transbank).
 * Secrets stay in env/Vercel — this only reports presence and safe metadata for operators.
 */

export type PaymentProviderName = "flow" | "transbank";

export type GoLiveScope = "pasarela" | "fiscal";

export type PagosChecklistItem = {
  id: string;
  titulo: string;
  scope: GoLiveScope;
  cumplido: boolean;
  critico: boolean;
  detalle?: string;
};

export type PagosGoLiveStatus = {
  provider: PaymentProviderName;
  /** Backcompat: readiness de la pasarela (sin obligaciones fiscales). */
  listoCheckout: boolean;
  listoPasarela: boolean;
  listoFiscal: boolean;
  listoProduccion: boolean;
  criticosPendientes: number;
  items: PagosChecklistItem[];
  vercelEnv: string | null;
  isProduction: boolean;
};

export type PagosChecklistRuntimeExtras = {
  /** Pending sessions older than stock hold TTL (30m) */
  stalePendingSessions?: number | null;
};

function hasEnv(key: string): boolean {
  const v = process.env[key]?.trim();
  return Boolean(v && v.length > 0);
}

function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview")
  );
}

export function resolveActivePaymentProvider(): PaymentProviderName {
  const raw = (process.env.PAYMENT_PROVIDER ?? "flow").toLowerCase().trim();
  return raw === "transbank" ? "transbank" : "flow";
}

export function buildPagosGoLiveChecklist(
  opts?: {
    cafFoliosRestantes?: number | null;
    cafMinFolios?: number;
    stalePendingSessions?: number | null;
  },
): PagosGoLiveStatus {
  const provider = resolveActivePaymentProvider();
  const isProduction = isProductionRuntime();
  const cafMin = opts?.cafMinFolios ?? 10;
  const cafRestantes = opts?.cafFoliosRestantes;
  const cafKnown = typeof cafRestantes === "number";
  const cafOk = cafKnown ? cafRestantes >= cafMin : !isProduction;

  const tiendaUrl =
    hasEnv("NEXT_PUBLIC_SITE_URL") ||
    hasEnv("NEXT_PUBLIC_URL_TIENDA") ||
    hasEnv("NEXT_PUBLIC_TIENDA_URL");
  const nucleoUrl =
    hasEnv("NEXT_PUBLIC_NUCLEO_API_URL") ||
    hasEnv("NEXT_PUBLIC_URL_NUCLEO") ||
    hasEnv("NEXT_PUBLIC_SITE_URL");

  const flowReady =
    hasEnv("FLOW_API_KEY") && hasEnv("FLOW_SECRET") && hasEnv("FLOW_API_URL");
  const tbkReady =
    hasEnv("TRANSBANK_COMMERCE_CODE") && hasEnv("TRANSBANK_API_KEY");
  const tbkEnv = (process.env.TRANSBANK_ENVIRONMENT ?? "integration").toLowerCase();
  const tbkIsProd = tbkEnv === "production";

  const providerReady = provider === "flow" ? flowReady : tbkReady;

  // Mock / test modes that must not silently take real money paths
  const mockForbidden =
    process.env.PAYMENT_MOCK === "1" ||
    process.env.PAYMENT_MOCK === "true" ||
    process.env.E2E_MOCK_PAYMENT === "1";

  const items: PagosChecklistItem[] = [
    {
      id: "provider",
      scope: "pasarela",
      titulo: `Provider activo: ${provider}`,
      cumplido: true,
      critico: false,
      detalle: `PAYMENT_PROVIDER=${provider} (env plataforma)`,
    },
    {
      id: "provider-keys",
      scope: "pasarela",
      titulo:
        provider === "flow"
          ? "Credenciales Flow (API key + secret + URL)"
          : "Credenciales Transbank (commerce code + API key)",
      cumplido: providerReady,
      critico: true,
      detalle: providerReady
        ? "Presentes en runtime (valores no expuestos)"
        : provider === "flow"
          ? "Set FLOW_API_KEY, FLOW_SECRET, FLOW_API_URL en Vercel nucleo"
          : "Set TRANSBANK_COMMERCE_CODE, TRANSBANK_API_KEY en Vercel nucleo",
    },
    {
      id: "tienda-url",
      scope: "pasarela",
      titulo: "URL tienda para return allowlist post-pago",
      cumplido: tiendaUrl,
      critico: true,
      detalle: tiendaUrl
        ? "SITE_URL / URL_TIENDA configurada"
        : "Set NEXT_PUBLIC_SITE_URL o NEXT_PUBLIC_URL_TIENDA",
    },
    {
      id: "nucleo-url",
      scope: "pasarela",
      titulo: "URL núcleo (webhook Flow / BFF)",
      cumplido: nucleoUrl,
      critico: provider === "flow",
      detalle: nucleoUrl
        ? "NUCLEO_API_URL o URL_NUCLEO"
        : "Set NEXT_PUBLIC_NUCLEO_API_URL (urlConfirmation Flow)",
    },
    {
      id: "no-mock",
      scope: "pasarela",
      titulo: "Sin mock de pago en este runtime",
      cumplido: !mockForbidden || !isProduction,
      critico: isProduction,
      detalle: mockForbidden
        ? "PAYMENT_MOCK / E2E_MOCK_PAYMENT activo — quitar en producción"
        : "OK",
    },
    {
      id: "caf-boleta",
      scope: "fiscal",
      titulo: "CAF boleta (39) con folios para auto-DTE post-checkout",
      cumplido: cafOk,
      critico: isProduction,
      detalle: cafKnown
        ? `${cafRestantes} folios restantes (mín. ${cafMin})`
        : "No medido — configurar CAF en SII o verificar empresa",
    },
    {
      id: "tbk-prod-env",
      scope: "pasarela",
      titulo: "Transbank environment=production (si provider=transbank)",
      cumplido: provider !== "transbank" || tbkIsProd || !isProduction,
      critico: provider === "transbank" && isProduction,
      detalle:
        provider === "transbank"
          ? `TRANSBANK_ENVIRONMENT=${tbkEnv}`
          : "N/A (provider no es transbank)",
    },
    {
      id: "supabase-admin",
      scope: "pasarela",
      titulo: "Service role para fulfill (ventas/stock)",
      cumplido: hasEnv("SUPABASE_SERVICE_ROLE_KEY") && hasEnv("NEXT_PUBLIC_SUPABASE_URL"),
      critico: true,
      detalle: hasEnv("SUPABASE_SERVICE_ROLE_KEY")
        ? "Service role presente"
        : "Falta SUPABASE_SERVICE_ROLE_KEY en nucleo",
    },
    {
      id: "stale-pending",
      scope: "pasarela",
      titulo: "Sin sesiones pending abandonadas (>30m)",
      cumplido:
        opts?.stalePendingSessions == null
          ? true
          : opts.stalePendingSessions === 0,
      critico: false,
      detalle:
        opts?.stalePendingSessions == null
          ? "No medido"
          : opts.stalePendingSessions === 0
            ? "0 stale"
            : `${opts.stalePendingSessions} stale — Expirar abandonadas (no toca órdenes con venta)`,
    },
    {
      id: "cron-checkout",
      scope: "pasarela",
      titulo: "Cron expire-stale checkout (stock holds)",
      cumplido: Boolean(
        process.env.CRON_SECRET?.trim() ||
          process.env.INTEGRATIONS_CRON_SECRET?.trim(),
      ),
      critico: false,
      detalle:
        process.env.CRON_SECRET?.trim() || process.env.INTEGRATIONS_CRON_SECRET?.trim()
          ? "Secret presente · schedule /api/cron/checkout"
          : "Set CRON_SECRET + vercel cron /api/cron/checkout",
    },
  ];

  const criticosPendientes = items.filter((i) => i.critico && !i.cumplido).length;
  const pasarelaPendientes = items.filter(
    (i) => i.scope === "pasarela" && i.critico && !i.cumplido,
  ).length;
  const fiscalPendientes = items.filter(
    (i) => i.scope === "fiscal" && i.critico && !i.cumplido,
  ).length;
  const listoPasarela = pasarelaPendientes === 0;
  const listoFiscal = fiscalPendientes === 0;
  const listoCheckout = listoPasarela;
  const listoProduccion =
    listoPasarela &&
    listoFiscal &&
    isProduction &&
    !mockForbidden &&
    (provider !== "transbank" || tbkIsProd);

  return {
    provider,
    listoCheckout,
    listoPasarela,
    listoFiscal,
    listoProduccion,
    criticosPendientes,
    items,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    isProduction,
  };
}
