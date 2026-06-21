import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyFeriaPostVenta,
  formatFeriaValidationError,
  isFeriaChannel,
  validateFeriaConsignacion,
} from "../feria-pos";

function mockSupabase(rpcResult: { data: unknown; error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(rpcResult);
  return { rpc } as unknown as SupabaseClient;
}

describe("feria-pos helpers", () => {
  it("isFeriaChannel returns true only for feria", () => {
    expect(isFeriaChannel("feria")).toBe(true);
    expect(isFeriaChannel("local")).toBe(false);
    expect(isFeriaChannel(null)).toBe(false);
  });

  it("validateFeriaConsignacion skips RPC for non-feria channel", async () => {
    const supabase = mockSupabase({ data: null, error: null });
    const result = await validateFeriaConsignacion(supabase, "user-1", [], "local");
    expect(result).toEqual({ required: false, ok: true });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("validateFeriaConsignacion calls RPC for feria channel", async () => {
    const supabase = mockSupabase({
      data: { required: true, ok: true, evento_id: "evt-1" },
      error: null,
    });
    const items = [{ producto_id: "prod-1", cantidad: 2 }];
    const result = await validateFeriaConsignacion(supabase, "user-1", items, "feria");
    expect(supabase.rpc).toHaveBeenCalledWith("validar_consignacion_feria", {
      p_user_id: "user-1",
      p_items: items,
      p_channel: "feria",
    });
    expect(result.ok).toBe(true);
  });

  it("validateFeriaConsignacion throws on RPC error", async () => {
    const supabase = mockSupabase({ data: null, error: { message: "RPC failed" } });
    await expect(
      validateFeriaConsignacion(supabase, "user-1", [{ producto_id: "p", cantidad: 1 }], "feria"),
    ).rejects.toThrow("RPC failed");
  });

  it("applyFeriaPostVenta skips RPC for non-feria channel", async () => {
    const supabase = mockSupabase({ data: null, error: null });
    const result = await applyFeriaPostVenta(supabase, "user-1", "venta-1", [], 1000, "local");
    expect(result).toEqual({ applied: false, reason: "not_feria_channel" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("applyFeriaPostVenta calls RPC for feria channel", async () => {
    const supabase = mockSupabase({
      data: { applied: true, evento_id: "evt-1" },
      error: null,
    });
    const items = [{ producto_id: "prod-1", cantidad: 1 }];
    const result = await applyFeriaPostVenta(supabase, "user-1", "venta-1", items, 5000, "feria");
    expect(supabase.rpc).toHaveBeenCalledWith("aplicar_venta_feria_post_venta", {
      p_user_id: "user-1",
      p_venta_id: "venta-1",
      p_items: items,
      p_total: 5000,
      p_channel: "feria",
    });
    expect(result.applied).toBe(true);
  });

  it("formatFeriaValidationError formats sin_consignacion and stock errors", () => {
    const msg = formatFeriaValidationError({
      ok: false,
      errors: [
        { producto_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", error: "sin_consignacion" },
        { producto_id: "prod-2", error: "stock_insuficiente", pendiente: 1, solicitado: 3 },
      ],
    });
    expect(msg).toContain("no consignado");
    expect(msg).toContain("1 disponible");
    expect(msg).toContain("3 solicitado");
  });

  it("formatFeriaValidationError uses default message when no errors", () => {
    expect(formatFeriaValidationError({ ok: false })).toBe(
      "Stock consignado insuficiente para venta en feria",
    );
  });
});