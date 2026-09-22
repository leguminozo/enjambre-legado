import { NextResponse } from "next/server";
import { processCartAbandonmentEmails } from "@/lib/notifications/cart-abandonment-worker";
import { processNotificationQueue } from "@/lib/notifications/worker";
import { processArcoExpirations } from "@/lib/arco/execute-solicitud";
import { logCronRun } from "@/lib/cron/run-logger";
import { createAdminClient } from "@enjambre/auth/server-index";
import { isCronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron (GET + Authorization: Bearer CRON_SECRET) o x-worker-secret.
 * Procesa notification_queue + carritos abandonados + ARCO vencidas (Ley 21.719).
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
    const admin = createAdminClient();
    const [queueResult, abandonmentResult, arcoResult] = await Promise.all([
      processNotificationQueue(),
      processCartAbandonmentEmails(),
      processArcoExpirations(admin, async (userId) => {
        await admin.auth.admin.deleteUser(userId);
      }).catch((err) => {
        console.error("[cron/notifications] arco expirations failed:", err);
        return { executed: 0 };
      }),
    ]);
    const body = {
      success: true,
      ...queueResult,
      abandonment: abandonmentResult,
      arco: arcoResult,
    };
    logCronRun("notifications", startedAt, { success: true, summary: body });
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/notifications] worker failed:", message);
    logCronRun("notifications", startedAt, { success: false, error: message });
    return NextResponse.json({ code: "worker_failed", message }, { status: 500 });
  }
}
