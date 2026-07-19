import type { AppVariables } from "@/api/lib/middleware";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@/api/lib/middleware";
import { tenantMiddleware } from "@/api/lib/middleware";
import { transactionsRouter } from "./transactions";
import { payoutsRouter } from "./payouts";
import { conciliacionRouter } from "./conciliacion";
import { readersRouter } from "./readers";
import { encryptSumUpApiKey, resolveSumUpClient } from "@/api/lib/sumup-client";
import { resolveSiiEncryptionKeyBytes } from "@/api/lib/sii-crypto";

export const sumupRoutes = new Hono<{ Variables: AppVariables }>();

sumupRoutes.use("*", authMiddleware, tenantMiddleware);

sumupRoutes.get("/config", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("sumup_config")
    .select(
      "id, empresa_id, merchant_code, environment, enabled, sync_interval_minutes, last_sync, created_at, updated_at, api_key",
    )
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (error || !data) {
    return c.json({
      data: {
        config: null,
        hasCredentials: false,
        encryptionReady: Boolean(resolveSiiEncryptionKeyBytes()),
      },
    });
  }

  const { api_key, ...safe } = data;
  return c.json({
    data: {
      config: {
        ...safe,
        hasCredentials: Boolean(api_key),
      },
      hasCredentials: Boolean(api_key),
      encryptionReady: Boolean(resolveSiiEncryptionKeyBytes()),
    },
  });
});

/**
 * Save SumUp merchant credentials from UI (config-en-UI).
 * apiKey optional on update: empty string keeps existing key.
 * API key is encrypted at rest when SII_CLAVE_ENCRYPTION_KEY (or fallback) is present.
 */
sumupRoutes.post(
  "/config",
  zValidator(
    "json",
    z.object({
      apiKey: z.string().optional(),
      merchantCode: z.string().min(1),
      environment: z.enum(["live", "test"]).default("test"),
      enabled: z.boolean().default(false),
      syncIntervalMinutes: z.number().int().min(5).max(1440).default(30),
    }),
  ),
  async (c) => {
    const supabase = c.get("supabase");
    const empresaId = c.get("empresaId");
    const body = c.req.valid("json");

    const { data: existing } = await supabase
      .from("sumup_config")
      .select("id, api_key")
      .eq("empresa_id", empresaId)
      .maybeSingle();

    let apiKeyToStore: string | undefined;
    if (body.apiKey && body.apiKey.trim().length > 0) {
      if (!resolveSiiEncryptionKeyBytes()) {
        // Fail-closed for new secrets when no material — do not store plaintext in production
        if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
          return c.json(
            {
              code: "encryption_key_missing",
              message:
                "Falta SII_CLAVE_ENCRYPTION_KEY (≥32). No se guarda la API key SumUp en claro en producción.",
            },
            503,
          );
        }
        // Non-prod: allow plaintext with warning flag
        apiKeyToStore = body.apiKey.trim();
      } else {
        const enc = await encryptSumUpApiKey(body.apiKey.trim());
        if (!enc) {
          return c.json({ code: "encryption_failed", message: "No se pudo cifrar la API key" }, 503);
        }
        apiKeyToStore = enc;
      }
    } else if (!existing?.api_key) {
      return c.json(
        { code: "api_key_required", message: "API key requerida en la primera configuración" },
        400,
      );
    }

    const payload: {
      empresa_id: string;
      merchant_code: string;
      environment: string;
      enabled: boolean;
      sync_interval_minutes: number;
      api_key?: string;
      updated_at: string;
    } = {
      empresa_id: empresaId,
      merchant_code: body.merchantCode.trim(),
      environment: body.environment,
      enabled: body.enabled,
      sync_interval_minutes: body.syncIntervalMinutes,
      updated_at: new Date().toISOString(),
    };
    if (apiKeyToStore) payload.api_key = apiKeyToStore;

    if (existing) {
      const { error } = await supabase
        .from("sumup_config")
        .update({
          merchant_code: payload.merchant_code,
          environment: payload.environment,
          enabled: payload.enabled,
          sync_interval_minutes: payload.sync_interval_minutes,
          updated_at: payload.updated_at,
          ...(payload.api_key ? { api_key: payload.api_key } : {}),
        })
        .eq("empresa_id", empresaId);
      if (error) {
        return c.json({ code: "config_update_failed", message: error.message }, 500);
      }
    } else {
      if (!payload.api_key) {
        return c.json({ code: "api_key_required", message: "API key requerida" }, 400);
      }
      const { error } = await supabase.from("sumup_config").insert({
        empresa_id: payload.empresa_id,
        merchant_code: payload.merchant_code,
        environment: payload.environment,
        enabled: payload.enabled,
        sync_interval_minutes: payload.sync_interval_minutes,
        api_key: payload.api_key,
        updated_at: payload.updated_at,
      });
      if (error) {
        return c.json({ code: "config_insert_failed", message: error.message }, 500);
      }
    }

    return c.json({ data: { success: true } });
  },
);

/** Go-live checklist for SumUp POS */
sumupRoutes.get("/checklist", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data: cfg } = await supabase
    .from("sumup_config")
    .select("api_key, merchant_code, environment, enabled, last_sync")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  const hasKey = Boolean(cfg?.api_key);
  const hasMerchant = Boolean(cfg?.merchant_code?.trim());
  const enabled = Boolean(cfg?.enabled);
  const encryptionReady = Boolean(resolveSiiEncryptionKeyBytes());
  const isLive = cfg?.environment === "live";

  let readersOnline = 0;
  let merchantOk = false;
  let apiReachable = false;
  let apiMessage = "";
  let terminalTableOk = false;

  // Probe mig 96 table (idempotency POS)
  {
    const { error: tableErr } = await supabase
      .from("sumup_terminal_checkouts")
      .select("id")
      .eq("empresa_id", empresaId)
      .limit(1);
    // relation missing → PostgREST error (42P01 / PGRST205)
    terminalTableOk = !tableErr;
  }

  if (hasKey && hasMerchant) {
    const resolved = await resolveSumUpClient(supabase, empresaId, { requireEnabled: false });
    if (resolved.ok) {
      const merchant = await resolved.client.getMerchant();
      if (merchant.success) {
        merchantOk = true;
        apiReachable = true;
      } else {
        apiMessage = merchant.error.message;
        // still try readers
      }
      const readers = await resolved.client.listReaders();
      if (readers.success) {
        apiReachable = true;
        const list = Array.isArray(readers.data) ? readers.data : [];
        readersOnline = list.filter((r) => {
          const status = String((r as { status?: string }).status ?? "").toLowerCase();
          return (
            !status ||
            status === "online" ||
            status === "paired" ||
            status === "ready" ||
            status === "busy"
          );
        }).length;
        if (list.length > 0 && readersOnline === 0) {
          readersOnline = list.length;
        }
      } else if (!apiMessage) {
        apiMessage = readers.error.message;
      }
    } else {
      apiMessage = resolved.message;
    }
  }

  type Item = {
    id: string;
    titulo: string;
    cumplido: boolean;
    critico: boolean;
    detalle?: string;
  };

  const items: Item[] = [
    {
      id: "merchant-code",
      titulo: "Merchant code configurado",
      cumplido: hasMerchant,
      critico: true,
      detalle: hasMerchant ? cfg!.merchant_code : "Falta en Configuración",
    },
    {
      id: "api-key",
      titulo: "API key guardada",
      cumplido: hasKey,
      critico: true,
      detalle: hasKey ? "Presente (cifrada o legacy)" : "Pegá la API key en Configuración",
    },
    {
      id: "encryption",
      titulo: "Material de cifrado en runtime",
      cumplido: encryptionReady,
      critico: process.env.VERCEL_ENV === "production",
      detalle: encryptionReady
        ? "SII_CLAVE_ENCRYPTION_KEY / SERVICE_ROLE"
        : "Set SII_CLAVE_ENCRYPTION_KEY en Vercel",
    },
    {
      id: "enabled",
      titulo: "Integración habilitada",
      cumplido: enabled,
      critico: true,
      detalle: enabled ? "enabled=true" : "Activá el switch en Configuración",
    },
    {
      id: "api-reachable",
      titulo: "API SumUp responde (merchant/readers)",
      cumplido: apiReachable,
      critico: true,
      detalle: apiReachable ? "OK" : apiMessage || "Sin prueba aún",
    },
    {
      id: "readers",
      titulo: "Al menos un lector/terminal conocido",
      cumplido: readersOnline > 0,
      critico: true,
      detalle: `${readersOnline} lector(es)`,
    },
    {
      id: "terminal-idempotency",
      titulo: "Tabla sumup_terminal_checkouts (idempotencia POS)",
      cumplido: terminalTableOk,
      critico: true,
      detalle: terminalTableOk
        ? "Mig 96 aplicada — evita doble cobro por checkout_reference"
        : "Aplicá migración 96 (sumup_terminal_checkouts)",
    },
    {
      id: "live-env",
      titulo: "Ambiente live (producción)",
      cumplido: isLive,
      critico: false,
      detalle: `Ambiente: ${cfg?.environment ?? "—"}`,
    },
    {
      id: "synced",
      titulo: "Al menos un sync de transacciones",
      cumplido: Boolean(cfg?.last_sync),
      critico: false,
      detalle: cfg?.last_sync ? String(cfg.last_sync) : "Ejecutá Sincronizar en Transacciones",
    },
  ];

  const criticosPendientes = items.filter((i) => i.critico && !i.cumplido).length;
  const listoPos = criticosPendientes === 0;

  return c.json({
    data: {
      listoPos,
      listoProduccion: listoPos && isLive,
      criticosPendientes,
      items,
      merchantOk,
      environment: cfg?.environment ?? null,
      enabled,
    },
  });
});

/** Smoke: verify credentials against SumUp API without enabling production side-effects */
sumupRoutes.post("/test-connection", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const resolved = await resolveSumUpClient(supabase, empresaId, { requireEnabled: false });
  if (!resolved.ok) {
    return c.json({ code: resolved.code, message: resolved.message }, 400);
  }

  const merchant = await resolved.client.getMerchant();
  const readers = await resolved.client.listReaders();

  return c.json({
    data: {
      merchantOk: merchant.success,
      merchant: merchant.success ? merchant.data : null,
      merchantError: merchant.success ? null : merchant.error.message,
      readersOk: readers.success,
      readersCount: readers.success
        ? (Array.isArray(readers.data) ? readers.data.length : 0)
        : 0,
      readers: readers.success ? readers.data : null,
      readersError: readers.success ? null : readers.error.message,
      environment: resolved.config.environment,
    },
  });
});

sumupRoutes.route("/transactions", transactionsRouter);
sumupRoutes.route("/payouts", payoutsRouter);
sumupRoutes.route("/conciliacion", conciliacionRouter);
sumupRoutes.route("/readers", readersRouter);
