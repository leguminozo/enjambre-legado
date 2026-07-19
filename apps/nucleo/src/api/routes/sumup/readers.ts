import type { AppVariables } from "@/api/lib/middleware";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { resolveSumUpClient } from "@/api/lib/sumup-client";

export const readersRouter = new Hono<{ Variables: AppVariables }>();

readersRouter.get("/", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const resolved = await resolveSumUpClient(supabase, empresaId);

  if (!resolved.ok) {
    return c.json({ code: resolved.code, message: resolved.message }, 400);
  }

  const readersResult = await resolved.client.listReaders();
  if (!readersResult.success) {
    return c.json(
      { code: "readers_failed", message: readersResult.error.message },
      502,
    );
  }

  return c.json({ data: readersResult.data });
});

readersRouter.post(
  "/checkout",
  zValidator(
    "json",
    z.object({
      reader_id: z.string().min(1),
      amount: z.number().positive(),
      currency: z
        .enum([
          "CLP",
          "USD",
          "EUR",
          "GBP",
          "BRL",
          "CHF",
          "COP",
          "CZK",
          "DKK",
          "BGN",
          "HRK",
          "HUF",
          "NOK",
          "PLN",
          "RON",
          "SEK",
        ])
        .default("CLP"),
      checkout_reference: z.string().min(1),
      description: z.string().optional(),
    }),
  ),
  async (c) => {
    const supabase = c.get("supabase");
    const empresaId = c.get("empresaId");
    const resolved = await resolveSumUpClient(supabase, empresaId);

    if (!resolved.ok) {
      return c.json({ code: resolved.code, message: resolved.message }, 400);
    }

    const { reader_id, amount, currency, checkout_reference, description } =
      c.req.valid("json");
    const checkoutResult = await resolved.client.createReaderCheckout(reader_id, {
      amount,
      currency,
      checkout_reference,
      description,
    });

    if (!checkoutResult.success) {
      return c.json(
        { code: "reader_checkout_failed", message: checkoutResult.error.message },
        502,
      );
    }

    return c.json({ data: checkoutResult.data }, 201);
  },
);

readersRouter.get("/checkout/:checkoutId", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const resolved = await resolveSumUpClient(supabase, empresaId);

  if (!resolved.ok) {
    return c.json({ code: resolved.code, message: resolved.message }, 400);
  }

  const checkoutId = c.req.param("checkoutId");
  const checkoutResult = await resolved.client.getCheckout(checkoutId);

  if (!checkoutResult.success) {
    return c.json(
      { code: "checkout_status_failed", message: checkoutResult.error.message },
      502,
    );
  }

  return c.json({ data: checkoutResult.data });
});

readersRouter.delete("/checkout/:readerId", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const resolved = await resolveSumUpClient(supabase, empresaId);

  if (!resolved.ok) {
    return c.json({ code: resolved.code, message: resolved.message }, 400);
  }

  const readerId = c.req.param("readerId");
  const terminateResult = await resolved.client.terminateReaderCheckout(readerId);

  if (!terminateResult.success) {
    return c.json(
      { code: "terminate_failed", message: terminateResult.error.message },
      502,
    );
  }

  return c.json({ success: true });
});
