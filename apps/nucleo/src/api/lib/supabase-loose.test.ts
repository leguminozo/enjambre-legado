import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";
import { fromLoose, looseClient, rpcLoose } from "./supabase-loose";

describe("supabase-loose", () => {
  it("fromLoose delega en .from(table)", () => {
    const from = vi.fn().mockReturnValue({ select: vi.fn() });
    const client = { from } as unknown as SupabaseClient<Database>;
    fromLoose(client, "interacciones");
    expect(from).toHaveBeenCalledWith("interacciones");
  });

  it("rpcLoose delega en .rpc(fn, args)", () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const client = { rpc } as unknown as SupabaseClient<Database>;
    rpcLoose(client, "add_traceable_stock", { p_producto_id: "x", p_qty: 1 });
    expect(rpc).toHaveBeenCalledWith("add_traceable_stock", {
      p_producto_id: "x",
      p_qty: 1,
    });
  });

  it("looseClient es el mismo objeto (cast)", () => {
    const client = { from: vi.fn() } as unknown as SupabaseClient<Database>;
    expect(looseClient(client)).toBe(client);
  });
});
