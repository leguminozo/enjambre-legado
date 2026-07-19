import { processNotificationQueue } from "@/lib/notifications/worker";
import { getEnvOrThrow } from "@/api/lib/env";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function isAuthorizedCron(req: NextRequest): boolean {
  const candidates = [
    [req.headers.get("x-worker-secret"), process.env.NOTIFICATIONS_WORKER_SECRET],
    [req.headers.get("x-cron-secret"), process.env.CRON_SECRET],
    [req.headers.get("x-integrations-cron-secret"), process.env.INTEGRATIONS_CRON_SECRET],
    [
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null,
      process.env.CRON_SECRET,
    ],
  ] as const;

  for (const [provided, expected] of candidates) {
    if (!provided || !expected) continue;
    if (timingSafeEqualString(provided, expected)) return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  // Fail-closed: missing env secrets never authorize (no `undefined === undefined`).
  if (!isAuthorizedCron(req)) {
    return NextResponse.json(
      { code: "unauthorized", message: "Invalid or missing secret" },
      { status: 401 }
    );
  }

  try {
    const result = await processNotificationQueue();
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Worker failed";
    console.error("[Cron Notifications] Error:", message);
    return NextResponse.json(
      { code: "worker_failed", message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}