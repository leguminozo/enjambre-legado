import type { AppVariables } from "@/api/lib/middleware";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { SumUpClient } from "@enjambre/sumup";

export const readersRouter = new Hono<{ Variables: AppVariables }>();

type ClientResult = { client: SumUpClient } | Response;

function isClientResult(result: ClientResult): result is { client: SumUpClient } {
  return result instanceof Response === false && "client" in result;
}

async function getClient(c: { get: (key: "supabase" | "empresaId") => unknown }): Promise<ClientResult> {
  const supabase = c.get("supabase") as import("@supabase/supabase-js").SupabaseClient;
  const empresaId = c.get("empresaId") as string;

  const { data: config } = await supabase
    .from("sumup_config")
    .select("api_key, merchant_code, environment")
    .eq("empresa_id", empresaId)
    .eq("enabled", true)
    .single();

  if (!config) {
    return new Response(JSON.stringify({ error: "no_config" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const cfg = config as unknown as Record<string, unknown>;
  const client = new SumUpClient({
    apiKey: cfg.api_key as string,
    merchantCode: cfg.merchant_code as string,
    environment: (cfg.environment as string) === "live" ? "live" : "test",
  });

  return { client };
}

readersRouter.get("/", async (c) => {
  const result = await getClient(c);
  if (!isClientResult(result)) return result;

  const readersResult = await result.client.listReaders();
  if (!readersResult.success) {
    return c.json({ code: "readers_failed", message: (readersResult as { success: false; error: { message: string } }).error.message }, 502);
  }

  return c.json({ data: readersResult.data });
});

readersRouter.post(
  "/checkout",
  zValidator("json", z.object({
    reader_id: z.string().min(1),
    amount: z.number().positive(),
    currency: z.enum(["CLP", "USD", "EUR", "GBP", "BRL", "CHF", "COP", "CZK", "DKK", "BGN", "HRK", "HUF", "NOK", "PLN", "RON", "SEK"]).default("CLP"),
    checkout_reference: z.string().min(1),
    description: z.string().optional(),
  })),
  async (c) => {
    const result = await getClient(c);
    if (!isClientResult(result)) return result;

    const { reader_id, amount, currency, checkout_reference, description } = c.req.valid("json");
    const checkoutResult = await result.client.createReaderCheckout(reader_id, {
      amount,
      currency,
      checkout_reference,
      description,
    });

    if (!checkoutResult.success) {
      return c.json({ code: "reader_checkout_failed", message: (checkoutResult as { success: false; error: { message: string } }).error.message }, 502);
    }

    return c.json({ data: checkoutResult.data }, 201);
  }
);

readersRouter.get("/checkout/:checkoutId", async (c) => {
  const result = await getClient(c);
  if (!isClientResult(result)) return result;

  const checkoutId = c.req.param("checkoutId");
  const checkoutResult = await result.client.getCheckout(checkoutId);

  if (!checkoutResult.success) {
    return c.json({ code: "checkout_status_failed", message: (checkoutResult as { success: false; error: { message: string } }).error.message }, 502);
  }

  return c.json({ data: checkoutResult.data });
});

readersRouter.delete("/checkout/:readerId", async (c) => {
  const result = await getClient(c);
  if (!isClientResult(result)) return result;

  const readerId = c.req.param("readerId");
  const terminateResult = await result.client.terminateReaderCheckout(readerId);

  if (!terminateResult.success) {
    return c.json({ code: "terminate_failed", message: (terminateResult as { success: false; error: { message: string } }).error.message }, 502);
  }

  return c.json({ success: true });
});
