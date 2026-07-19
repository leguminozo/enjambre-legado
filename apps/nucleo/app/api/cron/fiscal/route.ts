import { NextResponse } from "next/server";
import { monitorCafFolios } from "@/lib/fiscal/caf-alert-worker";
import { processPendingSiiPolls } from "@/lib/fiscal/pending-poll-worker";
import { processFiscalDocumentJobs } from "@/lib/fiscal/document-jobs-worker";
import { isCronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron: poll SII + CAF alert + cola sii_document_jobs.
 * Schedule: cada 15m (jobs DTE no deben esperar 24h).
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json(
      { code: "unauthorized", message: "Invalid cron secret" },
      { status: 401 },
    );
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
