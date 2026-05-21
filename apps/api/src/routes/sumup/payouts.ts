import type { AppVariables } from "../../types/hono";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { SumUpClient } from "@enjambre/sumup";

export const payoutsRouter = new Hono<{ Variables: AppVariables }>();

payoutsRouter.get(
  "/",
  zValidator(
    "query",
    z.object({
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      limit: z.coerce.number().int().min(1).max(9999).default(100),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
  ),
  async (c) => {
    const supabase = c.get("supabase");
    const empresaId = c.get("empresaId");
    const { start_date, end_date, limit, order } = c.req.valid("query");

    const { data: config } = await supabase
      .from("sumup_config")
      .select("api_key, merchant_code, environment")
      .eq("empresa_id", empresaId)
      .eq("enabled", true)
      .single();

    if (!config) {
      const { data: cached, error } = await supabase
        .from("sumup_payouts")
        .select("*")
        .eq("empresa_id", empresaId)
        .gte("date", start_date)
        .lte("date", end_date)
        .order("date", { ascending: order === "asc" })
        .limit(limit);

      if (error) {
        return c.json({ code: "payouts_query_failed", message: error.message }, 500);
      }
      return c.json({ data: cached ?? [], source: "cache" });
    }

    const cfg = config as Record<string, unknown>;
    const client = new SumUpClient({
      apiKey: cfg.api_key as string,
      merchantCode: cfg.merchant_code as string,
      environment: (cfg.environment as string) === "live" ? "live" : "test",
    });

    const result = await client.listPayouts({
      start_date,
      end_date,
      limit,
      order,
    });

    if (!result.success) {
      return c.json({ code: "payouts_api_failed", message: result.error.message }, 502);
    }

    for (const payout of result.data) {
      await supabase
        .from("sumup_payouts")
        .upsert({
          empresa_id: empresaId,
          sumup_id: payout.id,
          type: payout.type,
          amount: payout.amount,
          date: payout.date,
          currency: payout.currency,
          fee: payout.fee,
          status: payout.status,
          reference: payout.reference,
          transaction_code: payout.transaction_code,
        }, { onConflict: "empresa_id,sumup_id" });
    }

    return c.json({ data: result.data, source: "api" });
  }
);
