import type { Json } from "@enjambre/database/database.types";
import type { AppVariables } from "@/api/lib/middleware";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { SumUpClient } from "@enjambre/sumup";

export const transactionsRouter = new Hono<{ Variables: AppVariables }>();

transactionsRouter.get("/", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const limite = Math.min(Number(c.req.query("limit") ?? 50), 500);
  const offset = Number(c.req.query("offset") ?? 0);

  const { data, error } = await supabase
    .from("sumup_transacciones")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("fecha", { ascending: false })
    .range(offset, offset + limite - 1);

  if (error) {
    return c.json({ code: "transactions_query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

transactionsRouter.get("/no-conciliadas", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("sumup_transacciones")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("conciliado", false)
    .eq("estado", "successful")
    .order("fecha", { ascending: false })
    .limit(200);

  if (error) {
    return c.json({ code: "no_conciliadas_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

transactionsRouter.post("/sincronizar", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data: config } = await supabase
    .from("sumup_config")
    .select("api_key, merchant_code, environment")
    .eq("empresa_id", empresaId)
    .eq("enabled", true)
    .single();

  if (!config) {
    return c.json({ code: "no_config", message: "SumUp no configurado o deshabilitado" }, 400);
  }

  const cfg = config as Record<string, unknown>;
  const client = new SumUpClient({
    apiKey: cfg.api_key as string,
    merchantCode: cfg.merchant_code as string,
    environment: (cfg.environment as string) === "live" ? "live" : "test",
  });

  const oldestTime = c.req.query("from")
    ? new Date(c.req.query("from")!).toISOString()
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const result = await client.listTransactions({
    order: "descending",
    limit: 100,
    oldest_time: oldestTime,
    statuses: ["SUCCESSFUL"],
  });

  if (!result.success) {
    return c.json({ code: "sync_failed", message: (result as { success: false; error: { message: string } }).error.message }, 502);
  }

  const items = result.data.items ?? [];
  let upserted = 0;

  for (const item of items) {
    const row = {
      empresa_id: empresaId,
      sumup_id: item.id,
      fecha: item.timestamp,
      monto: item.amount,
      moneda: item.currency,
      estado: item.status === "SUCCESSFUL" ? "successful" :
              item.status === "FAILED" ? "failed" :
              item.status === "REFUNDED" ? "refunded" :
              item.status === "CANCELLED" ? "failed" : "pending",
      tipo: item.payment_type === "POS" ? "pos" :
            item.payment_type === "ECOM" ? "online" : "pos",
      producto: item.product_summary ?? null,
      descripcion: null,
      codigo_autorizacion: item.transaction_code,
      raw: item as unknown as Json,
    };

    const { error } = await supabase
      .from("sumup_transacciones")
      .upsert(row, { onConflict: "empresa_id,sumup_id" });

    if (!error) upserted++;
  }

  await supabase
    .from("sumup_config")
    .update({ last_sync: new Date().toISOString() })
    .eq("empresa_id", empresaId);

  return c.json({ data: { sincronizadas: upserted, total: items.length } });
});

transactionsRouter.get("/:id", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const id = c.req.param("id");

  const { data, error } = await supabase
    .from("sumup_transacciones")
    .select("*")
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .single();

  if (error || !data) {
    return c.json({ code: "not_found", message: "Transaccion no encontrada" }, 404);
  }

  return c.json({ data });
});
