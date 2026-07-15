import { NextResponse } from "next/server";
import { monitorCafFolios } from "@/lib/fiscal/caf-alert-worker";
import { processPendingSiiPolls } from "@/lib/fiscal/pending-poll-worker";
import { processFiscalDocumentJobs } from "@/lib/fiscal/document-jobs-worker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function resolveCronSecret(): string | undefined {
  return (
    process.env.CRON_SECRET ||
    process.env.FISCAL_WORKER_SECRET ||
    process.env.INTEGRATIONS_CRON_SECRET
  );
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function isAuthorized(request: Request): boolean {
  const secret = resolveCronSecret();
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length);
    if (timingSafeEqualString(token, secret)) return true;
  }

  const workerSecret = request.headers.get("x-worker-secret");
  if (workerSecret && timingSafeEqualString(workerSecret, secret)) return true;

  return false;
}

/**
 * Vercel Cron: poll facturas_compra en estado enviado + sync RCV al aceptar.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ code: "unauthorized", message: "Invalid cron secret" }, { status: 401 });
  }

  try {
    const [poll, cafAlerts, jobs] = await Promise.all([
      processPendingSiiPolls(),
      monitorCafFolios(),
      processFiscalDocumentJobs(),
    ]);
    return NextResponse.json({ success: true, poll, cafAlerts, jobs });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/fiscal] worker failed:", message);
    return NextResponse.json({ code: "worker_failed", message }, { status: 500 });
  }
}