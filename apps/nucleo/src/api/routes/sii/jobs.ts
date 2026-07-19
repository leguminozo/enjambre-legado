import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";

/**
 * Cola de emisión DTE (sii_document_jobs) — operación go-live.
 * Retry reschedule failed/dead_letter → pending now.
 */
export const jobsRoutes = new Hono<{ Variables: AppVariables }>();

/** Summary first so path is not captured by param routes later */
jobsRoutes.get("/emission-summary", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const [pendRes, envRes, openJobs] = await Promise.all([
    supabase
      .from("facturas_emitidas")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("estado_sii", "pendiente")
      .in("tipo_dte", [33, 39, 41]),
    supabase
      .from("facturas_emitidas")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("estado_sii", "enviado")
      .in("tipo_dte", [33, 39, 41]),
    supabase
      .from("sii_document_jobs")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .in("status", ["pending", "failed", "processing"]),
  ]);

  return c.json({
    data: {
      dtePendientes: pendRes.count ?? 0,
      dteEnviadosSinAceptacion: envRes.count ?? 0,
      jobsAbiertos: openJobs.count ?? 0,
      autoEmitBoleta: process.env.SII_AUTO_EMIT_BOLETA === "true",
      cronConfigured: Boolean(
        process.env.CRON_SECRET ||
          process.env.FISCAL_WORKER_SECRET ||
          process.env.INTEGRATIONS_CRON_SECRET,
      ),
    },
  });
});

jobsRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const status = c.req.query("status"); // optional filter
  const limit = Math.min(Number(c.req.query("limit") ?? 40), 100);

  let q = supabase
    .from("sii_document_jobs")
    .select(
      "id, source_type, source_id, tipo_dte, status, attempts, last_error, scheduled_at, completed_at, created_at, idempotency_key",
    )
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) {
    return c.json({ code: "jobs_query_failed", message: error.message }, 500);
  }

  const rows = data ?? [];
  const counts = {
    pending: rows.filter((j) => j.status === "pending").length,
    failed: rows.filter((j) => j.status === "failed").length,
    dead_letter: rows.filter((j) => j.status === "dead_letter").length,
    processing: rows.filter((j) => j.status === "processing").length,
    completed: rows.filter((j) => j.status === "completed").length,
  };

  // Full counts from DB (not limited sample)
  const [p, f, d] = await Promise.all([
    supabase
      .from("sii_document_jobs")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("status", "pending"),
    supabase
      .from("sii_document_jobs")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("status", "failed"),
    supabase
      .from("sii_document_jobs")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("status", "dead_letter"),
  ]);

  return c.json({
    data: {
      jobs: rows,
      countsSample: counts,
      open: {
        pending: p.count ?? 0,
        failed: f.count ?? 0,
        deadLetter: d.count ?? 0,
      },
      autoEmitBoleta: process.env.SII_AUTO_EMIT_BOLETA === "true",
      cronConfigured: Boolean(
        process.env.CRON_SECRET ||
          process.env.FISCAL_WORKER_SECRET ||
          process.env.INTEGRATIONS_CRON_SECRET,
      ),
    },
  });
});

/**
 * Dispara el worker de jobs de inmediato (admin ops).
 * Complementa cron fiscal cada 15m; emit paths son idempotentes (no re-envían aceptados).
 */
jobsRoutes.post("/process-now", async (c) => {
  try {
    const { processFiscalDocumentJobs } = await import(
      "@/lib/fiscal/document-jobs-worker"
    );
    const result = await processFiscalDocumentJobs();
    return c.json({
      success: true,
      data: result,
      message: "Worker de jobs ejecutado",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sii/jobs process-now]", message);
    return c.json({ code: "process_failed", message }, 500);
  }
});

/** Reschedule job for immediate retry via cron worker */
jobsRoutes.post("/:id/retry", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const id = c.req.param("id");

  const { data: job, error: findErr } = await supabase
    .from("sii_document_jobs")
    .select("id, status, attempts")
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (findErr || !job) {
    return c.json({ code: "not_found", message: "Job no encontrado" }, 404);
  }

  if (!["failed", "dead_letter", "pending", "processing"].includes(String(job.status))) {
    return c.json(
      {
        code: "invalid_state",
        message: `No se puede reintentar job en estado ${job.status}`,
      },
      409,
    );
  }

  const { data, error } = await supabase
    .from("sii_document_jobs")
    .update({
      status: "pending",
      scheduled_at: new Date().toISOString(),
      last_error: null,
      // keep attempts so we don't infinite-loop dead letters forever without ops notice
      attempts: job.status === "dead_letter" || job.status === "processing" ? 0 : job.attempts,
      completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .select("id, status, scheduled_at, attempts")
    .single();

  if (error) {
    return c.json({ code: "retry_failed", message: error.message }, 500);
  }

  return c.json({
    data,
    message: "Job reprogramado — usá Reintentar cola o esperá el cron fiscal (*/15)",
  });
});

