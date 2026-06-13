import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isRouteAllowed,
  getRoleRedirectPath,
  LEGACY_ROLE_MAP,
  ROUTE_ROLE_GUARDS,
} from "@enjambre/auth/role-redirect";

// ─── Mocks ───
let mockSessionUser: any = null;
let mockProfile: any = null;

vi.mock("next/server", async () => {
  return {
    NextResponse: {
      next: vi.fn(({ request }) => {
        const res = {
          cookies: { set: vi.fn() },
          headers: new Headers(),
        };
        return res;
      }),
      redirect: vi.fn((url) => ({
        url,
        status: 302,
        headers: new Headers({ location: url.toString() }),
      })),
    },
  };
});

vi.mock("@supabase/ssr", async () => {
  return {
    createServerClient: vi.fn((url, key, { cookies }) => {
      return {
        auth: {
          getUser: async () => {
            if (mockSessionUser) {
              return { data: { user: mockSessionUser }, error: null };
            }
            return { data: { user: null }, error: null };
          },
        },
      };
    }),
  };
});

vi.mock("@enjambre/auth/browser", async () => {
  return {
    getSupabaseUrl: () => "https://mock.supabase.co",
    getSupabaseKey: () => "eyJmock-key",
  };
});

// Need to import AFTER mocks are set up for createAuthMiddleware
const { createAuthMiddleware } = await import("@enjambre/auth/middleware");

describe("Auth Integration Flow", () => {
  beforeEach(() => {
    mockSessionUser = null;
    mockProfile = null;
    vi.clearAllMocks();
  });

  // ── 1. Role Redirect Logic ──
  describe("role-redirect.ts", () => {
    it("redirects admin to /ejecutivo", () => {
      expect(getRoleRedirectPath("admin")).toBe("/ejecutivo");
    });

    it("redirects creador to /creador", () => {
      expect(getRoleRedirectPath("creador")).toBe("/creador");
    });

    it("redirects rep_ventas to /caja", () => {
      expect(getRoleRedirectPath("rep_ventas")).toBe("/caja");
    });

    it("redirects cliente to /catalogo", () => {
      expect(getRoleRedirectPath("cliente")).toBe("/catalogo");
    });

    it("redirects unknown role to /perfil", () => {
      expect(getRoleRedirectPath("random")).toBe("/perfil");
    });

    it("maps legacy roles to admin", () => {
      expect(LEGACY_ROLE_MAP["gerente"]).toBe("admin");
      expect(LEGACY_ROLE_MAP["vendedor"]).toBe("admin");
      expect(LEGACY_ROLE_MAP["marketing"]).toBe("admin");
    });
  });

  // ── 2. Route Guards ──
  describe("isRouteAllowed", () => {
    it("allows admin to access /ejecutivo", () => {
      expect(isRouteAllowed("/ejecutivo", "admin")).toBe(true);
    });

    it("allows admin to access /caja", () => {
      expect(isRouteAllowed("/caja", "admin")).toBe(true);
    });

    it("allows rep_ventas to access /caja", () => {
      expect(isRouteAllowed("/caja", "rep_ventas")).toBe(true);
    });

    it("denies rep_ventas to access /ejecutivo", () => {
      expect(isRouteAllowed("/ejecutivo", "rep_ventas")).toBe(false);
    });

    it("allows creador to access /creador", () => {
      expect(isRouteAllowed("/creador", "creador")).toBe(true);
    });

    it("denies creador to access /ejecutivo", () => {
      expect(isRouteAllowed("/ejecutivo", "creador")).toBe(false);
    });

    it("allows any role to /api/ routes", () => {
      expect(isRouteAllowed("/api/health", "rep_ventas")).toBe(true);
    });

    it("allows any role to unknown routes", () => {
      expect(isRouteAllowed("/random-route", "cliente")).toBe(true);
    });

    it("allows legacy gerente role to /ejecutivo via normalization", () => {
      expect(isRouteAllowed("/ejecutivo", "gerente")).toBe(true);
    });
  });

  // ── 3. Middleware Integration ──
  describe("createAuthMiddleware", () => {
    const middleware = createAuthMiddleware({
      publicRoutes: ["/", "/login"],
      authRedirect: "/login",
    });

    function buildRequest(pathname: string, opts?: { user?: any }) {
      mockSessionUser = opts?.user ?? null;
      const url = new URL(pathname, "http://localhost:3000");
      (url as any).clone = () => new URL(url.toString());
      const req = {
        nextUrl: url,
        cookies: {
          getAll: () => [],
          set: vi.fn(),
        },
      };
      return req as any;
    }

    it("redirects unauthenticated user from /ejecutivo to /login", async () => {
      const req = buildRequest("/ejecutivo");
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    });

    it("redirects unauthenticated user from /caja to /login", async () => {
      const req = buildRequest("/caja");
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    });

    it("allows public route /login for unauthenticated user", async () => {
      const req = buildRequest("/login");
      const res = await middleware(req);
      expect(res.status).toBeUndefined(); // NextResponse.next() has no status
    });

    it("redirects authenticated admin from /login to /ejecutivo", async () => {
      const req = buildRequest("/login", {
        user: {
          id: "u1",
          email: "admin@test.com",
          app_metadata: { role: "admin" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("http://localhost:3000/ejecutivo");
    });

    it("redirects authenticated creador from /login to /creador", async () => {
      const req = buildRequest("/login", {
        user: {
          id: "u2",
          email: "creador@test.com",
          user_metadata: { role: "creador" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("http://localhost:3000/creador");
    });

    it("redirects authenticated rep_ventas from /login to /caja", async () => {
      const req = buildRequest("/login", {
        user: {
          id: "u3",
          email: "rep@test.com",
          app_metadata: { role: "rep_ventas" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("http://localhost:3000/caja");
    });

    it("redirects rep_ventas from /ejecutivo to their allowed route", async () => {
      const req = buildRequest("/ejecutivo", {
        user: {
          id: "u3",
          email: "rep@test.com",
          app_metadata: { role: "rep_ventas" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("http://localhost:3000/caja");
    });

    it("redirects creador from /ejecutivo to /creador", async () => {
      const req = buildRequest("/ejecutivo", {
        user: {
          id: "u2",
          email: "creador@test.com",
          user_metadata: { role: "creador" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("http://localhost:3000/creador");
    });

    it("allows admin to access /ejecutivo", async () => {
      const req = buildRequest("/ejecutivo", {
        user: {
          id: "u1",
          email: "admin@test.com",
          app_metadata: { role: "admin" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBeUndefined();
    });

    it("allows rep_ventas to access /caja", async () => {
      const req = buildRequest("/caja", {
        user: {
          id: "u3",
          email: "rep@test.com",
          app_metadata: { role: "rep_ventas" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBeUndefined();
    });

    it("handles legacy role gerente as admin", async () => {
      const req = buildRequest("/ejecutivo", {
        user: {
          id: "u4",
          email: "gerente@test.com",
          app_metadata: { role: "gerente" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBeUndefined(); // allowed because normalized to admin
    });
  });

  // ── 4. Auth Store Fallback (no-profile session) ──
  describe("auth-store checkUser fallback", () => {
    it("fallback user is constructed from session.user metadata when profile is missing", async () => {
      const mockSupabase = {
        auth: {
          getSession: async () => ({
            data: {
              session: {
                user: {
                  id: "fallback-id",
                  email: "fallback@test.com",
                  app_metadata: { role: "creador" },
                  user_metadata: {
                    full_name: "Fallback User",
                    nivel_guardian: "1",
                    avatar_url: "https://example.com/avatar.png",
                  },
                },
              },
            },
            error: null,
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        }),
      };

      // Mock the createClient used by auth-store
      vi.doMock("@enjambre/auth/browser", async () => {
        return {
          getSupabaseUrl: () => "https://mock.supabase.co",
          getSupabaseKey: () => "eyJmock-key",
          createClient: () => mockSupabase,
        };
      });

      const { useAuthStore } = await import("@enjambre/auth");
      // Reset store to initial state
      useAuthStore.setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: true,
      });

      await useAuthStore.getState().checkUser();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.id).toBe("fallback-id");
      expect(state.user?.email).toBe("fallback@test.com");
      expect(state.user?.role).toBe("creador");
      expect(state.user?.full_name).toBe("Fallback User");
      expect(state.user?.nivel_guardian).toBe("1");
      expect(state.user?.avatar_url).toBe("https://example.com/avatar.png");
      expect(state.isLoading).toBe(false);
    });
  });
});
