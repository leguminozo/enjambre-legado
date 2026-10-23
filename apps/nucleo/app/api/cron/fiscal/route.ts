import { NextResponse } from "next/server";
import { monitorCafFolios } from "@/lib/fiscal/caf-alert-worker";
import { processPendingSiiPolls } from "@/lib/fiscal/pending-poll-worker";
import { processFiscalDocumentJobs } from "@/lib/fiscal/document-jobs-worker";
import { logCronRun } from "@/lib/cron/run-logger";
import { isCronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron: poll SII + CAF alert + cola sii_document_jobs.
 * Schedule: diario 13:00 UTC (apps/nucleo/vercel.json: 0 13 * * *).
 * La emisión operativa se dispara on-mutation (checkout / admin ops / POST /api/sii/jobs/process-now).
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
    const [poll, cafAlerts, jobs] = await Promise.all([
      processPendingSiiPolls(),
      monitorCafFolios(),
      processFiscalDocumentJobs(),
    ]);
    const body = { success: true, poll, cafAlerts, jobs };
    logCronRun("fiscal", startedAt, { success: true, summary: body });
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/fiscal] worker failed:", message);
    logCronRun("fiscal", startedAt, { success: false, error: message });
    return NextResponse.json({ code: "worker_failed", message }, { status: 500 });
  }
}
