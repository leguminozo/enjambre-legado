import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../../../app/api/[[...routes]]/route";

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
vi.mock("@enjambre/auth/browser", () => ({
  createAdminClient: () => mockAdminClient,
}));

const mockNotifyShipmentDispatched = vi.fn();
vi.mock("@/lib/notifications/enqueue-transactional", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/notifications/enqueue-transactional")>();
  return {
    ...mod,
    notifyShipmentDispatched: () => mockNotifyShipmentDispatched(),
  };
});

const ENVIO = {
  id: "envio-1",
  user_id: "buyer-user-id", // envío automático del checkout: el user_id es del comprador
  empresa_id: "empresa-1",
  venta_id: "venta-1",
  tracking_code: "OYZ-ORD12345",
  destino: "Av. Siempre Viva 123, Santiago, RM",
  items: "2x Miel 500g",
  status: "pendiente",
  eta: null,
  via: "Blue Express",
  courier_code: "blueexpress",
  shipping_cost: 3990,
  created_at: "2026-08-04T12:00:00Z",
};

describe("Logística API Routes", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
    mockFrom.mockReset();
    mockAdminClient.from.mockReset();
    mockNotifyShipmentDispatched.mockReset();
  });

  const makeChain = (finalValue: any, opts?: { captureInsert?: any[]; captureEq?: any[] }) => {
    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn((col: string, val: unknown) => {
      opts?.captureEq?.push([col, val]);
      return chain;
    });
    chain.not = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.insert = vi.fn((payload: unknown) => {
      opts?.captureInsert?.push(payload);
      return chain;
    });
    chain.single = vi.fn().mockResolvedValue(finalValue);
    chain.maybeSingle = vi.fn().mockResolvedValue(finalValue);
    chain.then = (onfulfilled: any) => Promise.resolve(finalValue).then(onfulfilled);
    return chain;
  };

  const tenantMembership = (table: string, captured: any[]) => {
    if (table === "usuarios_empresas") {
      return makeChain({ data: [{ empresa_id: "empresa-1", rol: "admin" }], error: null });
    }
    if (table === "profiles") {
      return makeChain({ data: { role: "admin" }, error: null });
    }
    return makeChain({ data: [], error: null }, { captureEq: captured });
  };

  describe("GET /api/logistica/dashboard", () => {
    it("should return 401 if unauthorized", async () => {
      const res = await app.request("/api/logistica/dashboard");
      expect(res.status).toBe(401);
    });

    it("should expose company envios (including checkout auto-created ones) and mark ventas as ya-enviado", async () => {
      const envioEqCalls: any[] = [];
      const ventas = [
        { id: "venta-1", total: 25000, channel: "web", created_at: "2026-08-04T12:00:00Z", metodo_pago: "webpay", productos: [{ quantity: 2, name: "Miel 500g" }] },
        { id: "venta-2", total: 12000, channel: "pos", created_at: "2026-08-04T11:00:00Z", metodo_pago: "efectivo", productos: [{ cantidad: 1, nombre: "Polen 250g" }] },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === "usuarios_empresas") {
          return makeChain({ data: [{ empresa_id: "empresa-1", rol: "admin" }], error: null });
        }
        if (table === "profiles") {
          return makeChain({ data: { role: "admin" }, error: null });
        }
        if (table === "logistica_envios") {
          // Mismo dataset para la cola y para la detección de venta_id
          return makeChain({ data: [ENVIO], error: null }, { captureEq: envioEqCalls });
        }
        if (table === "ventas") {
          return makeChain({ data: ventas, error: null });
        }
        return makeChain({ data: [], error: null });
      });

      const res = await app.request("/api/logistica/dashboard", {
        headers: {
          "Authorization": "Bearer valid-token",
          "origin": "http://localhost:3000",
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();

      // La cola se filtra por empresa, no por user_id del admin
      expect(envioEqCalls).toContainEqual(["empresa_id", "empresa-1"]);
      expect(json.data.envios).toHaveLength(1);
      expect(json.data.envios[0].id).toBe("envio-1");

      // La venta-1 ya tiene envío (creado por el checkout con otro user_id) → no se ofrece duplicar
      const venta1 = json.data.ventasRecientes.find((v: any) => v.id === "venta-1");
      const venta2 = json.data.ventasRecientes.find((v: any) => v.id === "venta-2");
      expect(venta1.pendiente_envio).toBe(false);
      expect(venta2.pendiente_envio).toBe(true);
      // Normalización de ventas.productos (checkout usa quantity/name, POS cantidad/nombre)
      expect(venta1.items).toEqual([{ cantidad: 2, nombre: "Miel 500g" }]);
      expect(venta2.items).toEqual([{ cantidad: 1, nombre: "Polen 250g" }]);
    });
  });

  describe("GET /api/logistica/envios", () => {
    it("should filter the queue by empresa_id", async () => {
      const envioEqCalls: any[] = [];
      mockFrom.mockImplementation((table: string) => {
        if (table === "usuarios_empresas") {
          return makeChain({ data: [{ empresa_id: "empresa-1", rol: "admin" }], error: null });
        }
        if (table === "profiles") {
          return makeChain({ data: { role: "admin" }, error: null });
        }
        return makeChain({ data: [ENVIO], error: null }, { captureEq: envioEqCalls });
      });

      const res = await app.request("/api/logistica/envios", {
        headers: {
          "Authorization": "Bearer valid-token",
          "origin": "http://localhost:3000",
        },
      });

      expect(res.status).toBe(200);
      expect(envioEqCalls).toContainEqual(["empresa_id", "empresa-1"]);
      expect(envioEqCalls.some(([col]) => col === "user_id")).toBe(false);
    });
  });

  describe("PATCH /api/logistica/envios/:id", () => {
    it("should update an auto-created envio by empresa and notify the buyer on shipped status", async () => {
      const adminUpdateCalls: any[] = [];
      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === "ventas") {
          const chain: any = {};
          chain.update = vi.fn((payload: unknown) => {
            adminUpdateCalls.push(payload);
            return chain;
          });
          chain.eq = vi.fn().mockReturnValue(chain);
          chain.select = vi.fn().mockReturnValue(chain);
          chain.maybeSingle = vi
            .fn()
            .mockResolvedValue({ data: { buyer_email: "buyer@example.com", user_id: null, buy_order: "ORD-12345" }, error: null });
          chain.then = (onfulfilled: any) =>
            Promise.resolve({ data: { buyer_email: "buyer@example.com", user_id: null, buy_order: "ORD-12345" }, error: null }).then(onfulfilled);
          return chain;
        }
        return makeChain({ data: null, error: null });
      });

      // Fetch del envío previo (maybeSingle) + update (single)
      const envioChain: any = {};
      envioChain.select = vi.fn().mockReturnValue(envioChain);
      envioChain.eq = vi.fn().mockReturnValue(envioChain);
      envioChain.maybeSingle = vi
        .fn()
        .mockResolvedValue({ data: { ...ENVIO, status: "pendiente" }, error: null });
      envioChain.update = vi.fn().mockReturnValue(envioChain);
      envioChain.single = vi
        .fn()
        .mockResolvedValue({ data: { ...ENVIO, status: "En tránsito" }, error: null });
      envioChain.then = (onfulfilled: any) =>
        Promise.resolve({ data: { ...ENVIO, status: "En tránsito" }, error: null }).then(onfulfilled);
      mockFrom.mockImplementation((table: string) => {
        if (table === "usuarios_empresas") {
          return makeChain({ data: [{ empresa_id: "empresa-1", rol: "admin" }], error: null });
        }
        if (table === "profiles") {
          return makeChain({ data: { role: "admin" }, error: null });
        }
        if (table === "logistica_envios") {
          return envioChain;
        }
        return makeChain({ data: null, error: null });
      });
      mockNotifyShipmentDispatched.mockResolvedValue(true);

      const res = await app.request("/api/logistica/envios/envio-1", {
        method: "PATCH",
        headers: {
          "Authorization": "Bearer valid-token",
          "origin": "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "En tránsito" }),
      });

      expect(res.status).toBe(200);
      // La venta del comprador se marca despachada (válido tras el CHECK ampliado)
      expect(adminUpdateCalls).toContainEqual({ estado: "despachado" });
      // El comprador recibe la notificación de despacho
      expect(mockNotifyShipmentDispatched).toHaveBeenCalledOnce();
    });
  });

  describe("POST /api/logistica/envios", () => {
    it("should create an envio linked to the sale with the admin's empresa_id", async () => {
      const insertCalls: any[] = [];
      // El POST con estado "En tránsito" + venta_id dispara el flujo de despacho (admin)
      mockAdminClient.from.mockImplementation((table: string) => {
        return makeChain({ data: null, error: null });
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "usuarios_empresas") {
          return makeChain({ data: [{ empresa_id: "empresa-1", rol: "admin" }], error: null });
        }
        if (table === "profiles") {
          return makeChain({ data: { role: "admin" }, error: null });
        }
        const chain = makeChain(
          { data: { ...ENVIO, id: "envio-nuevo", venta_id: "00000000-0000-4000-8000-000000000002" }, error: null },
          { captureInsert: insertCalls },
        );
        return chain;
      });

      const res = await app.request("/api/logistica/envios", {
        method: "POST",
        headers: {
          "Authorization": "Bearer valid-token",
          "origin": "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tracking_code: "VNT-1234",
          destino: "Calle 1, Temuco",
          items: "1x Polen 250g",
          status: "En tránsito",
          venta_id: "00000000-0000-4000-8000-000000000002",
        }),
      });

      expect(res.status).toBe(201);
      expect(insertCalls).toHaveLength(1);
      expect(insertCalls[0].empresa_id).toBe("empresa-1");
      expect(insertCalls[0].venta_id).toBe("00000000-0000-4000-8000-000000000002");
      expect(insertCalls[0].user_id).toBe("mock-user-id");
    });
  });
});
