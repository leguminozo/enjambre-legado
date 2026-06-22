import { Hono } from "hono";
import { z } from "zod";
import { createAdminClient } from "@enjambre/auth/browser";
import { getPaymentProviderByName } from "@/api/lib/payments/provider";
import { getCheckoutSession } from "@/api/lib/payments/types";
import { fulfillCheckout } from "@/api/lib/payments/checkout-fulfill";
import { verifyInternalApiKey } from "@enjambre/auth/internal-api-secret";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/api/lib/ratelimit";

const webhooksApp = new Hono();

async function webhookRateLimit(c: { req: { header: (name: string) => string | undefined; ip?: string }; json: (data: unknown, status: number) => Response; header: (name: string, value: string) => void }) {
  const identifier = getClientIdentifier(c);
  const result = await checkRateLimit({ identifier, ...RATE_LIMIT_CONFIGS.webhook });

  c.header("X-RateLimit-Limit", String(result.limit));
  c.header("X-RateLimit-Remaining", String(result.remaining));
  c.header("X-RateLimit-Reset", String(result.reset));

  if (!result.success) {
    c.header("Retry-After", String(result.retryAfter || 60));
    return c.json({ code: "rate_limited", message: "Demasiadas solicitudes. Intenta de nuevo más tarde." }, 429);
  }
  return null;
}

const TransbankWebhookSchema = z.object({
  token_ws: z.string(),
  buyOrder: z.string().optional(),
  sessionId: z.string().optional(),
  cardNumber: z.string().optional(),
  accountingDate: z.string().optional(),
  transactionDate: z.string().optional(),
  authorizationCode: z.string().optional(),
  paymentTypeCode: z.string().optional(),
  responseCode: z.number().optional(),
  amount: z.number().optional(),
  sharesNumber: z.number().optional(),
});

webhooksApp.post("/transbank", async (c) => {
  const rateLimitResult = await webhookRateLimit(c);
  if (rateLimitResult) return rateLimitResult;

  try {
    const payload = await c.req.json();
    const parsed = TransbankWebhookSchema.safeParse(payload);

    if (!parsed.success) {
      return c.json({ code: "invalid_payload", message: "Invalid Transbank webhook payload" }, 400);
    }

    const { token_ws, buyOrder: clientBuyOrder } = parsed.data;
    const supabase = createAdminClient();

    const provider = getPaymentProviderByName('transbank');
    const commitResult = await provider.commit(token_ws);

    const buyOrder = commitResult.buyOrder?.trim();
    if (!buyOrder) {
      return c.json({ code: "invalid_provider_response", message: "Missing buyOrder from payment provider" }, 400);
    }

    if (clientBuyOrder && clientBuyOrder !== buyOrder) {
      console.warn(`[Webhook Transbank] buyOrder mismatch client=${clientBuyOrder} provider=${buyOrder}`);
      return c.json({ code: "buy_order_mismatch", message: "buyOrder does not match payment provider" }, 400);
    }

    const { data: sessionRow, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select("buy_order, status")
      .eq("buy_order", buyOrder)
      .single();

    if (sessionError || !sessionRow) {
      await supabase.from("payment_failures").insert({
        checkout_session_id: null,
        provider: "transbank",
        webhook_payload: parsed.data,
        error_message: "Checkout session not found",
        status: "failed",
      });
      return c.json({ code: "session_not_found", message: "Checkout session not found" }, 404);
    }

    if (sessionRow.status === "completed") {
      return c.json({ code: "already_completed", message: "Payment already processed" }, 200);
    }

    if (!commitResult.authorized) {
      await supabase
        .from("checkout_sessions")
        .update({ status: "expired" })
        .eq("buy_order", buyOrder);

      return c.json({ code: "payment_failed", message: "Payment not authorized by Transbank" }, 200);
    }

    const session = await getCheckoutSession(buyOrder);
    if (!session) {
      return c.json({ code: "session_not_found", message: "Checkout session not found" }, 404);
    }

    const fulfilled = await fulfillCheckout(supabase, {
      buyOrder,
      session,
      authorizationCode: commitResult.authorizationCode,
      paymentProvider: 'transbank',
    });

    if (!fulfilled.ok) {
      await supabase.from("payment_failures").insert({
        checkout_session_id: null,
        provider: "transbank",
        webhook_payload: parsed.data,
        error_message: "Failed to persist venta after authorized payment",
        status: "pending",
      });
      return c.json({ code: "fulfill_failed", message: "Failed to persist sale" }, 500);
    }

    return c.json({ code: "success", message: "Payment processed successfully" }, 200);
  } catch (error) {
    console.error("[Webhook Transbank] Error:", error);
    return c.json({ code: "internal_error", message: "Internal server error" }, 500);
  }
});

webhooksApp.post("/retry-failed", async (c) => {
  const internalKey = c.req.header("x-internal-key");
  const bearer = c.req.header("authorization")?.startsWith("Bearer ")
    ? c.req.header("authorization")!.slice(7)
    : null;
  if (!verifyInternalApiKey(internalKey) && !verifyInternalApiKey(bearer)) {
    return c.json({ code: "unauthorized", message: "Unauthorized" }, 401);
  }

  const supabase = createAdminClient();

  const { data: failures, error } = await supabase
    .from("payment_failures")
    .select("*")
    .in("status", ["pending", "retrying"])
    .lte("next_retry_at", new Date().toISOString())
    .limit(10);

  if (error || !failures) {
    return c.json({ code: "error", message: "Failed to fetch pending retries" }, 500);
  }

  const results = [];

  for (const failure of failures) {
    try {
      await supabase.rpc("schedule_payment_retry", { p_failure_id: failure.id });
      results.push({ id: failure.id, status: "scheduled" });
    } catch (err) {
      results.push({ id: failure.id, status: "error", error: String(err) });
    }
  }

  return c.json({ processed: results.length, results }, 200);
});

export { webhooksApp };
