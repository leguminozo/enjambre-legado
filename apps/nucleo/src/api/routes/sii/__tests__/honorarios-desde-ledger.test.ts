import { describe, expect, it, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";

const rpcMock = vi.fn();

vi.mock("@/api/lib/middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/lib/middleware")>();
  return {
    ...actual,
    authMiddleware: async (_c: unknown, next: () => Promise<void>) => next(),
    tenantMiddleware: async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
      c.set("empresaId", "empresa-1");
      c.set("profileRole", "admin");
      c.set("rol", "admin");
      await next();
    },
    requireProfileRole: () => async (_c: unknown, next: () => Promise<void>) => next(),
  };
});

import { postHonorarioDesdeLedger } from "../honorarios-desde-ledger";

function buildApp(profileRole: string) {
  const app = new Hono<{ Variables: AppVariables }>();
  app.use("*", async (c, next) => {
    c.set("empresaId", "empresa-1");
    c.set("profileRole", profileRole);
    c.set("supabase", {
      rpc: rpcMock,
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: {
                id: "hon-1",
                monto_bruto: 100000,
                monto_retencion: 15250,
                descripcion: "test",
                fecha: "2026-06-21",
                estado: "pendiente",
                incentivo_ledger_id: "ledger-1",
                tercero: null,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never);
    await next();
  });
  app.post("/desde-ledger", postHonorarioDesdeLedger);
  return app;
}

describe("POST /honorarios/desde-ledger", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({
      data: { honorario_id: "hon-1", monto_bruto: 100000 },
      error: null,
    });
  });

  it("calls preparar_honorario_desde_ledger RPC", async () => {
    const app = buildApp("admin");
    const res = await app.request("/desde-ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ledger_id: "550e8400-e29b-41d4-a716-446655440000",
        fecha: "2026-06-21",
        tercero_rut: "12.345.678-9",
        tercero_nombre: "Operador Test",
      }),
    });

    expect(res.status).toBe(201);
    expect(rpcMock).toHaveBeenCalledWith("preparar_honorario_desde_ledger", expect.objectContaining({
      p_empresa_id: "empresa-1",
      p_tercero_rut: "12.345.678-9",
      p_tasa_retencion: 0.1525,
    }));
  });

  it("rejects invalid body", async () => {
    const app = buildApp("admin");
    const res = await app.request("/desde-ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ledger_id: "bad", fecha: "" }),
    });
    expect(res.status).toBe(400);
  });
});