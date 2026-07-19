/**
 * Runtime env presence matrix for nucleo (no secret values).
 * Aligns with scripts/lib/env-matrix-def.mjs go-live groups.
 */

export type EnvPresence = "ok" | "missing";

export type EnvCheckItem = {
  id: string;
  label: string;
  status: EnvPresence;
  critical: boolean;
  detail?: string;
};

export type EnvGroupStatus = {
  id: string;
  label: string;
  critical: boolean;
  ok: boolean;
  items: EnvCheckItem[];
};

export type EnvRuntimeStatus = {
  listoCore: boolean;
  listoGoLiveSoft: boolean;
  criticosPendientes: number;
  groups: EnvGroupStatus[];
  vercelEnv: string | null;
  nodeEnv: string | null;
};

function present(...keys: string[]): boolean {
  return keys.some((k) => Boolean(process.env[k]?.trim()));
}

function presentAll(...keys: string[]): boolean {
  return keys.every((k) => Boolean(process.env[k]?.trim()));
}

function item(
  id: string,
  label: string,
  ok: boolean,
  critical: boolean,
  detail?: string,
): EnvCheckItem {
  return {
    id,
    label,
    status: ok ? "ok" : "missing",
    critical,
    detail,
  };
}

export function buildNucleoEnvRuntimeStatus(): EnvRuntimeStatus {
  const encryptionOk =
    present("SII_CLAVE_ENCRYPTION_KEY") ||
    present("FISCAL_ENCRYPTION_KEY") ||
    (present("SUPABASE_SERVICE_ROLE_KEY") &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0) >= 32);

  const groups: EnvGroupStatus[] = [
    {
      id: "core",
      label: "Core multi-app",
      critical: true,
      ok: false,
      items: [
        item("supabase_url", "NEXT_PUBLIC_SUPABASE_URL", present("NEXT_PUBLIC_SUPABASE_URL"), true),
        item(
          "supabase_anon",
          "Anon / publishable key",
          present(
            "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          ),
          true,
        ),
        item(
          "service_role",
          "SUPABASE_SERVICE_ROLE_KEY",
          present("SUPABASE_SERVICE_ROLE_KEY"),
          true,
        ),
        item(
          "internal_api",
          "INTERNAL_API_SECRET",
          present("INTERNAL_API_SECRET"),
          true,
          "Mismo valor en nucleo · tienda · campo",
        ),
        item(
          "tienda_url",
          "URL tienda (CORS / returnUrl)",
          present("NEXT_PUBLIC_URL_TIENDA", "NEXT_PUBLIC_TIENDA_URL"),
          true,
        ),
      ],
    },
    {
      id: "fiscal",
      label: "SII / cifrado",
      critical: true,
      ok: false,
      items: [
        item(
          "encryption",
          "Material cifrado SII/SumUp/Banco (≥32)",
          encryptionOk,
          true,
          "Preferí SII_CLAVE_ENCRYPTION_KEY dedicado",
        ),
        item("cron", "CRON_SECRET (fiscal/jobs)", present("CRON_SECRET"), false),
      ],
    },
    {
      id: "pagos_web",
      label: "Checkout web",
      critical: false,
      ok: false,
      items: [
        item(
          "payment_provider",
          "PAYMENT_PROVIDER",
          present("PAYMENT_PROVIDER"),
          false,
          process.env.PAYMENT_PROVIDER?.trim() || "default flow",
        ),
        item(
          "flow",
          "Flow API (key+secret+url)",
          presentAll("FLOW_API_KEY", "FLOW_SECRET", "FLOW_API_URL"),
          false,
        ),
        item(
          "transbank",
          "Transbank (commerce+api key)",
          presentAll("TRANSBANK_COMMERCE_CODE", "TRANSBANK_API_KEY"),
          false,
        ),
      ],
    },
    {
      id: "ops",
      label: "Ops",
      critical: false,
      ok: false,
      items: [
        item(
          "upstash",
          "Upstash rate limit",
          presentAll("UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"),
          false,
        ),
        item(
          "nucleo_public",
          "URL pública núcleo (webhooks)",
          present("NEXT_PUBLIC_NUCLEO_API_URL", "NEXT_PUBLIC_URL_NUCLEO"),
          false,
        ),
        item(
          "campo_url",
          "NEXT_PUBLIC_URL_CAMPO",
          present("NEXT_PUBLIC_URL_CAMPO"),
          false,
        ),
      ],
    },
  ];

  for (const g of groups) {
    g.ok = g.items
      .filter((i) => i.critical)
      .every((i) => i.status === "ok");
  }

  const criticalItems = groups.flatMap((g) => g.items.filter((i) => i.critical));
  const criticosPendientes = criticalItems.filter((i) => i.status !== "ok").length;
  const listoCore = criticosPendientes === 0;
  // soft: at least one payment path ready
  const pagos = groups.find((g) => g.id === "pagos_web");
  const paymentSoft =
    pagos?.items.some(
      (i) => (i.id === "flow" || i.id === "transbank") && i.status === "ok",
    ) ?? false;

  return {
    listoCore,
    listoGoLiveSoft: listoCore && paymentSoft && present("CRON_SECRET"),
    criticosPendientes,
    groups,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  };
}
