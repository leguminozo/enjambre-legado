import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../app";

const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: (_url: string, _key: string, options?: any) => {
      const authHeader = options?.global?.headers?.Authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
      return {
        auth: {
          getUser: async () => {
            if (token === "valid-token") {
              return { data: { user: { id: "mock-user-id", email: "mock@example.com" } }, error: null };
            }
            return { data: { user: null }, error: new Error("Invalid token") };
          },
        },
        from: mockFrom,
      } as any;
    },
  };
});

const mockAdminClient = {
  from: vi.fn(),
};
vi.mock("@enjambre/auth/server-index", () => ({
  createAdminClient: () => mockAdminClient,
}));

describe("POST /api/infusiones/proveedores", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
    mockFrom.mockReset();
    mockAdminClient.from.mockReset();
  });

  const makeChain = (finalValue: any, opts?: { captureInsert?: any[]; captureEq?: any[] }) => {
    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn((col: string, val: unknown) => {
      opts?.captureEq?.push([col, val]);
      return chain;
    });
    chain.order = vi.fn().mockReturnValue(chain);
    chain.insert = vi.fn((payload: unknown) => {
      opts?.captureInsert?.push(payload);
      return chain;
    });
    chain.single = vi.fn().mockResolvedValue(finalValue);
    chain.maybeSingle = vi.fn().mockResolvedValue(finalValue);
    chain.then = (onfulfilled: any) => Promise.resolve(finalValue).then(onfulfilled);
    return chain;
  };

  it("should create a proveedor with valid data", async () => {
    const capturedInserts: any[] = [];
    mockFrom.mockImplementation((table: string) => {
      if (table === "usuarios_empresas") {
        return makeChain({ data: [{ empresa_id: "empresa-1", rol: "admin" }], error: null });
      }
      if (table === "profiles") {
        return makeChain({ data: { role: "admin" }, error: null });
      }
      if (table === "infusion_proveedores") {
        return makeChain(
          { data: { id: "prov-123", nombre: "Stevia Chillan", contacto: "+56957419603" }, error: null },
          { captureInsert: capturedInserts }
        );
      }
      return makeChain({ data: [], error: null });
    });

    const res = await app.request("/api/infusiones/proveedores", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        nombre: "Stevia Chillan",
        contacto: "+56957419603",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe("prov-123");
    expect(capturedInserts[0]).toEqual({
      nombre: "Stevia Chillan",
      contacto: "+56957419603",
      ubicacion: null,
      notas: null,
      user_id: "mock-user-id",
    });
  });
});
