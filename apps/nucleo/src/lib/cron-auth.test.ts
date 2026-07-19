import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isCronAuthorized,
  resolveCronSecret,
  timingSafeEqualString,
} from "./cron-auth";

describe("cron-auth", () => {
  const keys = [
    "CRON_SECRET",
    "FISCAL_WORKER_SECRET",
    "NOTIFICATIONS_WORKER_SECRET",
    "INTEGRATIONS_CRON_SECRET",
  ] as const;
  const snap: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of keys) {
      snap[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of keys) {
      if (snap[k] === undefined) delete process.env[k];
      else process.env[k] = snap[k];
    }
  });

  it("timingSafeEqualString rejects different lengths and values", () => {
    expect(timingSafeEqualString("abc", "ab")).toBe(false);
    expect(timingSafeEqualString("abc", "abd")).toBe(false);
    expect(timingSafeEqualString("secret", "secret")).toBe(true);
  });

  it("fail-closed when no secret configured", () => {
    expect(resolveCronSecret()).toBeUndefined();
    const req = new Request("http://x", {
      headers: { Authorization: "Bearer anything" },
    });
    expect(isCronAuthorized(req)).toBe(false);
  });

  it("accepts Bearer and x-worker-secret", () => {
    process.env.CRON_SECRET = "cron-secret-xyz";
    expect(
      isCronAuthorized(
        new Request("http://x", {
          headers: { Authorization: "Bearer cron-secret-xyz" },
        }),
      ),
    ).toBe(true);
    expect(
      isCronAuthorized(
        new Request("http://x", {
          headers: { "x-worker-secret": "cron-secret-xyz" },
        }),
      ),
    ).toBe(true);
    expect(
      isCronAuthorized(
        new Request("http://x", {
          headers: { Authorization: "Bearer wrong" },
        }),
      ),
    ).toBe(false);
  });

  it("accepts alternate worker secrets when CRON_SECRET also set", () => {
    process.env.CRON_SECRET = "primary-cron";
    process.env.NOTIFICATIONS_WORKER_SECRET = "notif-only";
    expect(
      isCronAuthorized(
        new Request("http://x", {
          headers: { "x-worker-secret": "notif-only" },
        }),
      ),
    ).toBe(true);
  });
});
