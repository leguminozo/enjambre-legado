import { NextResponse } from "next/server";
import { expireStaleCheckoutSessions } from "@/api/lib/payments";
import { logCronRun } from "@/lib/cron/run-logger";
import { isCronAuthorized } from "@/lib/cron-auth";
import { createAdminClient } from "@enjambre/auth/server-index";
import { enqueueTransactionalNotification } from "@/lib/notifications/enqueue-transactional";
import { fromLoose } from "@/api/lib/supabase-loose";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Movimiento 3 — dunning: email único (dedupe por sub) a las suscripciones en
 * past_due para que el cliente regularice. Fire-and-forget: un fallo de
 * notificación nunca rompe el cron.
 */
async function sendPastDueDunning(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  try {
    const { data: pastDueSubs } = await fromLoose(admin, "subscriptions")
      .select(
        "id, user_id, current_period_end, subscription_plans(name, price_clp, frequency), profiles(email)",
      )
      .eq("status", "past_due")
      .limit(50);

    let sent = 0;
    for (const sub of (pastDueSubs ?? []) as Array<Record<string, unknown>>) {
      const plan = Array.isArray(sub.subscription_plans)
        ? sub.subscription_plans[0]
        : sub.subscription_plans;
      const profile = Array.isArray(sub.profiles)
        ? sub.profiles[0]
        : sub.profiles;
      const email = (profile as { email?: string | null } | null | undefined)?.email ?? null;
      const userId = typeof sub.user_id === "string" ? sub.user_id : undefined;
      const planName = (plan as { name?: string } | null | undefined)?.name ?? "tu reposición";

      const result = await enqueueTransactionalNotification(admin, {
        dedupeKey: `subscription-past-due:${sub.id}`,
        source: "subscription_past_due",
        email,
        userId,
        subject: "Tu reposición necesita regularización",
        body: `Tu reposición de ${planName} quedó pendiente de pago. Actualiza tu método de pago o regulariza desde tu perfil para no perder tus entregas: /perfil/reposicion`,
      });
      if (result.emailQueued || result.inAppCreated) sent += 1;
    }
    return sent;
  } catch (err) {
    console.error("[cron/checkout] dunning failed:", err);
    return 0;
  }
}

/**
 * Vercel Cron: expire pending checkout sessions + release stock holds +
 * renovación de reposiciones (process_ritual_renewals v3: heala entregas
 * pagadas y marca past_due) + dunning de reposiciones vencidas.
 * Un solo cron diario para no gastar cuota.
 * Complements admin expire-stale; TTL default 30m (reserve_checkout_stock).
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json(
      { code: "unauthorized", message: "Invalid cron secret" },
      { status: 401 },
    );
  }

  const startedAt = Date.now();
  try {
    const result = await expireStaleCheckoutSessions({
      olderThanMinutes: 30,
      limit: 100,
    });

    let renewals: Record<string, unknown> | null = null;
    let dunningSent = 0;
    try {
      const admin = createAdminClient({ persistSession: false });
      const { data, error } = await admin.rpc("process_ritual_renewals");
      if (error) {
        console.error("[cron/checkout] process_ritual_renewals failed:", error.message);
      } else {
        renewals = (data ?? null) as Record<string, unknown> | null;
      }
      dunningSent = await sendPastDueDunning(admin);
    } catch (err) {
      console.error("[cron/checkout] renewals/dunning error:", err);
    }

    const body = {
      success: true,
      expired: result.expired,
      buyOrders: result.buyOrders,
      renewals,
      dunningSent,
    };
    logCronRun("checkout", startedAt, { success: true, summary: body });
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/checkout] expire-stale failed:", message);
    logCronRun("checkout", startedAt, { success: false, error: message });
    return NextResponse.json({ code: "worker_failed", message }, { status: 500 });
  }
}
