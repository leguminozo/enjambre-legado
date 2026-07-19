/**
 * Pure go-live status for web checkout (Flow / Transbank).
 * Secrets stay in env/Vercel — this only reports presence and safe metadata for operators.
 */

export type PaymentProviderName = "flow" | "transbank";

export type PagosChecklistItem = {
  id: string;
  titulo: string;
  cumplido: boolean;
  critico: boolean;
  detalle?: string;
};

export type PagosGoLiveStatus = {
  provider: PaymentProviderName;
  listoCheckout: boolean;
  listoProduccion: boolean;
  criticosPendientes: number;
  items: PagosChecklistItem[];
  vercelEnv: string | null;
  isProduction: boolean;
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
  opts?: { cafFoliosRestantes?: number | null; cafMinFolios?: number },
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
      titulo: `Provider activo: ${provider}`,
      cumplido: true,
      critico: false,
      detalle: `PAYMENT_PROVIDER=${provider} (env plataforma)`,
    },
    {
      id: "provider-keys",
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
      titulo: "URL tienda para return allowlist post-pago",
      cumplido: tiendaUrl,
      critico: true,
      detalle: tiendaUrl
        ? "SITE_URL / URL_TIENDA configurada"
        : "Set NEXT_PUBLIC_SITE_URL o NEXT_PUBLIC_URL_TIENDA",
    },
    {
      id: "nucleo-url",
      titulo: "URL núcleo (webhook Flow / BFF)",
      cumplido: nucleoUrl,
      critico: provider === "flow",
      detalle: nucleoUrl
        ? "NUCLEO_API_URL o URL_NUCLEO"
        : "Set NEXT_PUBLIC_NUCLEO_API_URL (urlConfirmation Flow)",
    },
    {
      id: "no-mock",
      titulo: "Sin mock de pago en este runtime",
      cumplido: !mockForbidden || !isProduction,
      critico: isProduction,
      detalle: mockForbidden
        ? "PAYMENT_MOCK / E2E_MOCK_PAYMENT activo — quitar en producción"
        : "OK",
    },
    {
      id: "caf-boleta",
      titulo: "CAF boleta (39) con folios para auto-DTE post-checkout",
      cumplido: cafOk,
      critico: isProduction,
      detalle: cafKnown
        ? `${cafRestantes} folios restantes (mín. ${cafMin})`
        : "No medido — configurar CAF en SII o verificar empresa",
    },
    {
      id: "tbk-prod-env",
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
      titulo: "Service role para fulfill (ventas/stock)",
      cumplido: hasEnv("SUPABASE_SERVICE_ROLE_KEY") && hasEnv("NEXT_PUBLIC_SUPABASE_URL"),
      critico: true,
      detalle: hasEnv("SUPABASE_SERVICE_ROLE_KEY")
        ? "Service role presente"
        : "Falta SUPABASE_SERVICE_ROLE_KEY en nucleo",
    },
  ];

  const criticosPendientes = items.filter((i) => i.critico && !i.cumplido).length;
  const listoCheckout = criticosPendientes === 0;
  const listoProduccion =
    listoCheckout &&
    isProduction &&
    !mockForbidden &&
    (provider !== "transbank" || tbkIsProd);

  return {
    provider,
    listoCheckout,
    listoProduccion,
    criticosPendientes,
    items,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    isProduction,
  };
}
