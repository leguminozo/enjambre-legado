import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockProcessPendingSiiPolls = vi.fn();
const mockMonitorCafFolios = vi.fn();
const mockProcessFiscalDocumentJobs = vi.fn();

vi.mock("@/lib/fiscal/pending-poll-worker", () => ({
  processPendingSiiPolls: () => mockProcessPendingSiiPolls(),
}));

vi.mock("@/lib/fiscal/caf-alert-worker", () => ({
  monitorCafFolios: () => mockMonitorCafFolios(),
}));

vi.mock("@/lib/fiscal/document-jobs-worker", () => ({
  processFiscalDocumentJobs: () => mockProcessFiscalDocumentJobs(),
}));

describe("GET /api/cron/fiscal", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "fiscal-cron-secret";
    delete process.env.FISCAL_WORKER_SECRET;
    delete process.env.INTEGRATIONS_CRON_SECRET;
    mockProcessPendingSiiPolls.mockReset();
    mockMonitorCafFolios.mockReset();
    mockMonitorCafFolios.mockResolvedValue({
      scanned: 0,
      alertsQueued: 0,
      skipped: 0,
      errors: [],
    });
    mockProcessFiscalDocumentJobs.mockResolvedValue({
      processed: 0,
      completed: 0,
      failed: 0,
      deadLetter: 0,
    });
  });

  it("returns 401 without credentials", async () => {
    const res = await GET(new Request("http://localhost/api/cron/fiscal"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with valid bearer and poll results", async () => {
    mockProcessPendingSiiPolls.mockResolvedValue({
      polled: 2,
      polledVentas: 1,
      accepted: 1,
      rejected: 0,
      rcvSynced: 1,
      rcvVentasSynced: 0,
      errors: [],
    });

    const res = await GET(
      new Request("http://localhost/api/cron/fiscal", {
        headers: { Authorization: "Bearer fiscal-cron-secret" },
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.poll.polled).toBe(2);
    expect(json.poll.accepted).toBe(1);
    expect(json.poll.rcvSynced).toBe(1);
    expect(json.cafAlerts).toEqual({ scanned: 0, alertsQueued: 0, skipped: 0, errors: [] });
  });
});