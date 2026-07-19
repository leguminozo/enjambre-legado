import type { AppVariables } from "@/api/lib/middleware";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { resolveSumUpClient } from "@/api/lib/sumup-client";

export const readersRouter = new Hono<{ Variables: AppVariables }>();

function normalizeReadersPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as { items?: unknown[]; readers?: unknown[]; data?: unknown[] };
    if (Array.isArray(o.items)) return o.items;
    if (Array.isArray(o.readers)) return o.readers;
    if (Array.isArray(o.data)) return o.data;
  }
  return [];
}

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

  const list = normalizeReadersPayload(readersResult.data);
  return c.json({ data: list });
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
      checkout_reference: z.string().min(1).max(120),
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

    const body = c.req.valid("json");
    // CLP is integer currency
    const amount =
      body.currency === "CLP" ? Math.round(body.amount) : body.amount;
    if (!(amount > 0)) {
      return c.json({ code: "invalid_amount", message: "Monto inválido" }, 400);
    }

    const ref = body.checkout_reference.trim();

    // Idempotency: same reference → return existing checkout_id (no second terminal push)
    const { data: existing } = await supabase
      .from("sumup_terminal_checkouts")
      .select("checkout_id, reader_id, amount, status")
      .eq("empresa_id", empresaId)
      .eq("checkout_reference", ref)
      .maybeSingle();

    if (existing?.checkout_id && existing.status === "pending") {
      return c.json(
        {
          data: {
            checkout_id: existing.checkout_id,
            idempotent: true,
            status: existing.status,
          },
        },
        200,
      );
    }
    if (existing?.checkout_id && existing.status === "paid") {
      return c.json(
        {
          code: "already_paid",
          message: "Esta referencia de checkout ya fue cobrada",
          data: { checkout_id: existing.checkout_id, status: "paid" },
        },
        409,
      );
    }

    const checkoutResult = await resolved.client.createReaderCheckout(body.reader_id, {
      amount,
      currency: body.currency,
      checkout_reference: ref,
      description: body.description,
    });

    if (!checkoutResult.success) {
      return c.json(
        { code: "reader_checkout_failed", message: checkoutResult.error.message },
        502,
      );
    }

    const checkoutId =
      (checkoutResult.data as { checkout_id?: string; id?: string })?.checkout_id ??
      (checkoutResult.data as { id?: string })?.id ??
      null;

    if (checkoutId) {
      // Best-effort persist — if mig 96 not applied, still return checkout_id
      const { error: upsertErr } = await supabase.from("sumup_terminal_checkouts").upsert(
        {
          empresa_id: empresaId,
          checkout_reference: ref,
          checkout_id: checkoutId,
          reader_id: body.reader_id,
          amount,
          currency: body.currency,
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "empresa_id,checkout_reference" },
      );
      if (upsertErr) {
        console.warn("[sumup] terminal checkout persist failed (apply mig 96?):", upsertErr.message);
      }
    }

    return c.json(
      {
        data: {
          ...checkoutResult.data,
          checkout_id: checkoutId,
          idempotent: false,
        },
      },
      201,
    );
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

  const status = String(
    (checkoutResult.data as { status?: string })?.status ?? "",
  ).toUpperCase();
  if (status === "PAID" || status === "FAILED" || status === "EXPIRED") {
    const mapped =
      status === "PAID" ? "paid" : status === "FAILED" ? "failed" : "expired";
    await supabase
      .from("sumup_terminal_checkouts")
      .update({ status: mapped, updated_at: new Date().toISOString() })
      .eq("empresa_id", empresaId)
      .eq("checkout_id", checkoutId);
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

  await supabase
    .from("sumup_terminal_checkouts")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("empresa_id", empresaId)
    .eq("reader_id", readerId)
    .eq("status", "pending");

  return c.json({ success: true });
});
