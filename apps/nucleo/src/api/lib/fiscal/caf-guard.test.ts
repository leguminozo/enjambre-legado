import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CafExhaustedError,
  assertCafAvailable,
  getCafAlertThreshold,
  getCafMinFolios,
  getFoliosRestantes,
} from "./caf-guard";

function mockSupabaseCaf(data: { folio_hasta: number; folio_actual: number } | null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    })),
  } as any;
}

describe("caf-guard", () => {
  beforeEach(() => {
    delete process.env.SII_CAF_MIN_FOLIOS;
  });

  it("getCafMinFolios defaults to 10", () => {
    expect(getCafMinFolios()).toBe(10);
  });

  it("getCafMinFolios respects env override", () => {
    process.env.SII_CAF_MIN_FOLIOS = "5";
    expect(getCafMinFolios()).toBe(5);
  });

  it("getCafAlertThreshold defaults to 50", () => {
    expect(getCafAlertThreshold()).toBe(50);
  });

  it("getCafAlertThreshold respects env override", () => {
    process.env.SII_CAF_ALERT_THRESHOLD = "25";
    expect(getCafAlertThreshold()).toBe(25);
  });

  it("getFoliosRestantes computes remaining folios", async () => {
    const supabase = mockSupabaseCaf({ folio_hasta: 100, folio_actual: 92 });
    expect(await getFoliosRestantes(supabase, "emp-1", 46)).toBe(8);
  });

  it("getFoliosRestantes returns 0 when no CAF", async () => {
    const supabase = mockSupabaseCaf(null);
    expect(await getFoliosRestantes(supabase, "emp-1", 46)).toBe(0);
  });

  it("assertCafAvailable throws CafExhaustedError below threshold", async () => {
    const supabase = mockSupabaseCaf({ folio_hasta: 100, folio_actual: 95 });
    await expect(assertCafAvailable(supabase, "emp-1", 46)).rejects.toBeInstanceOf(CafExhaustedError);
  });

  it("assertCafAvailable passes when enough folios", async () => {
    const supabase = mockSupabaseCaf({ folio_hasta: 100, folio_actual: 80 });
    const result = await assertCafAvailable(supabase, "emp-1", 46);
    expect(result.foliosRestantes).toBe(20);
  });
});