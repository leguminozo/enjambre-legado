import { NextResponse } from "next/server";
import { expireStaleCheckoutSessions } from "@/api/lib/payments";
import { isCronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron: expire pending checkout sessions + release stock holds.
 * Complements admin expire-stale; TTL default 30m (reserve_checkout_stock).
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json(
      { code: "unauthorized", message: "Invalid cron secret" },
      { status: 401 },
    );
  }

  try {
    const result = await expireStaleCheckoutSessions({
      olderThanMinutes: 30,
      limit: 100,
    });
    return NextResponse.json({
      success: true,
      expired: result.expired,
      buyOrders: result.buyOrders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/checkout] expire-stale failed:", message);
    return NextResponse.json({ code: "worker_failed", message }, { status: 500 });
  }
}
