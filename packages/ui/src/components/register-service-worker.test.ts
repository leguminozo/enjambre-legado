import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RegisterServiceWorker } from "./register-service-worker";

describe("RegisterServiceWorker", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("is defined as a named export function", () => {
    expect(typeof RegisterServiceWorker).toBe("function");
  });
});
