import { NextResponse } from "next/server";
import { processCartAbandonmentEmails } from "@/lib/notifications/cart-abandonment-worker";
import { processNotificationQueue } from "@/lib/notifications/worker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function resolveCronSecret(): string | undefined {
  return (
    process.env.CRON_SECRET ||
    process.env.NOTIFICATIONS_WORKER_SECRET ||
    process.env.INTEGRATIONS_CRON_SECRET
  );
}

function isAuthorized(request: Request): boolean {
  const secret = resolveCronSecret();
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const workerSecret = request.headers.get("x-worker-secret");
  return workerSecret === secret;
}

/**
 * Vercel Cron (GET + Authorization: Bearer CRON_SECRET) o invocación manual con x-worker-secret.
 * Procesa notification_queue cada minuto.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ code: "unauthorized", message: "Invalid cron secret" }, { status: 401 });
  }

  try {
    const [queueResult, abandonmentResult] = await Promise.all([
      processNotificationQueue(),
      processCartAbandonmentEmails(),
    ]);
    return NextResponse.json({
      success: true,
      ...queueResult,
      abandonment: abandonmentResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/notifications] worker failed:", message);
    return NextResponse.json({ code: "worker_failed", message }, { status: 500 });
  }
}