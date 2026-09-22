import { createAdminClient } from "@enjambre/auth/server-index";

export type CronJobName = "notifications" | "fiscal" | "checkout";

type CronOutcome = {
  success: boolean;
  summary?: Record<string, unknown>;
  error?: string;
};

/**
 * Registra la ejecución en cron_runs para el Tablero de Salud.
 * Fire-and-forget: nunca lanza, nunca rompe el cron que lo invoca.
 */
export function logCronRun(job: CronJobName, startedAtMs: number, outcome: CronOutcome): void {
  try {
    const admin = createAdminClient();
    const finished = new Date();
    const insert = admin.from("cron_runs").insert({
      job,
      started_at: new Date(startedAtMs).toISOString(),
      finished_at: finished.toISOString(),
      duration_ms: Math.max(0, Date.now() - startedAtMs),
      success: outcome.success,
      summary: outcome.summary ?? {},
      error: outcome.error ?? null,
    });
    Promise.resolve(insert).catch((err) => {
      console.warn(`[cron/${job}] run log failed:`, err instanceof Error ? err.message : err);
    });
  } catch (err) {
    console.warn(`[cron/${job}] run log skipped:`, err instanceof Error ? err.message : err);
  }
}
